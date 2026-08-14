import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/validations/media";

// The church's sermon channel: https://www.youtube.com/@livingwordma/videos
// Change this if the channel handle ever changes — nothing else needs updating.
const CHANNEL_HANDLE = "livingwordma";

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";
const SYNC_SETTING_KEY = "youtubeSync";

function apiKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error(
      "YOUTUBE_API_KEY is not set. Add one from https://console.cloud.google.com/apis/credentials (enable \"YouTube Data API v3\" first) to .env before syncing sermons."
    );
  }
  return key;
}

async function ytFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${YT_API_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", apiKey());

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YouTube API error (${res.status}) on ${path}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

/** ISO 8601 duration ("PT1H2M3S") -> whole seconds. */
function parseIsoDuration(iso: string): number | undefined {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return undefined;
  const [, h, m, s] = match;
  return (Number(h ?? 0) * 3600) + (Number(m ?? 0) * 60) + Number(s ?? 0);
}

interface YtChannelListResponse {
  items: { id: string; contentDetails?: { relatedPlaylists?: { uploads?: string } } }[];
}

interface YtPlaylistItemsResponse {
  items: {
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      resourceId: { videoId: string };
      thumbnails: Record<string, { url: string } | undefined>;
    };
  }[];
  nextPageToken?: string;
}

interface YtVideoListResponse {
  items: { id: string; contentDetails: { duration: string } }[];
}

async function resolveUploadsPlaylistId(): Promise<string> {
  const data = await ytFetch<YtChannelListResponse>("channels", {
    part: "contentDetails",
    forHandle: CHANNEL_HANDLE,
  });
  const playlistId = data.items[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) throw new Error(`Could not resolve an uploads playlist for @${CHANNEL_HANDLE}. Check the handle is correct.`);
  return playlistId;
}

function bestThumbnail(thumbnails: YtPlaylistItemsResponse["items"][number]["snippet"]["thumbnails"]) {
  return thumbnails.maxres?.url ?? thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url ?? null;
}

async function fetchDurations(videoIds: string[]) {
  const durations = new Map<string, number | undefined>();
  // videos.list accepts up to 50 ids per call.
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await ytFetch<YtVideoListResponse>("videos", { part: "contentDetails", id: batch.join(",") });
    for (const item of data.items) durations.set(item.id, parseIsoDuration(item.contentDetails.duration));
  }
  return durations;
}

async function uniqueSlug(title: string) {
  const base = slugify(title);
  let slug = base;
  let n = 1;
  while (await prisma.video.findUnique({ where: { slug } })) slug = `${base}-${++n}`;
  return slug;
}

export interface YouTubeSyncResult {
  imported: number;
  skipped: number;
  channelHandle: string;
}

/**
 * Pulls new uploads from the church's YouTube channel into the Watch
 * library. This always pages to the natural end of the channel
 * (`!nextPageToken`) rather than stopping early at the first — or even
 * first fully-duplicate-page — match against already-imported videos.
 *
 * An early-stop optimization was tried and removed: newest-first paging
 * plus "stop once already-imported" can't recover from ANY prior run
 * that was ever cut short (a page cap, a crash, a quota error) — the
 * newest videos immediately re-match on the next run and halt the loop
 * before it reaches whatever older content was missed, hiding it
 * permanently. Always walking the full channel costs roughly one
 * `playlistItems.list` call (1 quota unit) per ~50 videos total in the
 * channel, every run — for an hourly cron against a channel with a few
 * thousand uploads that's a few thousand units/day, comfortably inside
 * YouTube's default 10,000/day quota, and simplicity + guaranteed
 * correctness is worth that small, fixed cost.
 *
 * The page cap below is a runaway-loop guard only (e.g. against an API
 * bug that never returns a stop condition) — it must stay far above any
 * real channel's upload count.
 */
export async function syncYouTubeSermons(): Promise<YouTubeSyncResult> {
  const uploadsPlaylistId = await resolveUploadsPlaylistId();

  const newItems: YtPlaylistItemsResponse["items"] = [];
  let pageToken: string | undefined;
  let skipped = 0;

  for (let page = 0; page < 400; page++) {
    const data = await ytFetch<YtPlaylistItemsResponse>("playlistItems", {
      part: "snippet",
      playlistId: uploadsPlaylistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });

    const pageVideoIds = data.items.map((item) => item.snippet.resourceId.videoId);
    const existingRefs = await prisma.video.findMany({
      where: { provider: "YOUTUBE", providerRef: { in: pageVideoIds } },
      select: { providerRef: true },
    });
    const existingSet = new Set(existingRefs.map((v) => v.providerRef));

    for (const item of data.items) {
      if (existingSet.has(item.snippet.resourceId.videoId)) {
        skipped++;
      } else {
        newItems.push(item);
      }
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  if (newItems.length === 0) {
    await prisma.appSetting.upsert({
      where: { key: SYNC_SETTING_KEY },
      create: { key: SYNC_SETTING_KEY, value: { lastSyncedAt: new Date().toISOString(), channelHandle: CHANNEL_HANDLE } },
      update: { value: { lastSyncedAt: new Date().toISOString(), channelHandle: CHANNEL_HANDLE } },
    });
    return { imported: 0, skipped, channelHandle: CHANNEL_HANDLE };
  }

  const durations = await fetchDurations(newItems.map((i) => i.snippet.resourceId.videoId));

  for (const item of newItems) {
    const videoId = item.snippet.resourceId.videoId;
    const slug = await uniqueSlug(item.snippet.title);
    await prisma.video.create({
      data: {
        title: item.snippet.title,
        slug,
        description: item.snippet.description || undefined,
        thumbnailUrl: bestThumbnail(item.snippet.thumbnails),
        provider: "YOUTUBE",
        providerRef: videoId,
        durationSeconds: durations.get(videoId),
        datePreached: new Date(item.snippet.publishedAt),
        visibility: "PUBLIC",
      },
    });
  }

  await prisma.appSetting.upsert({
    where: { key: SYNC_SETTING_KEY },
    create: { key: SYNC_SETTING_KEY, value: { lastSyncedAt: new Date().toISOString(), channelHandle: CHANNEL_HANDLE } },
    update: { value: { lastSyncedAt: new Date().toISOString(), channelHandle: CHANNEL_HANDLE } },
  });

  return { imported: newItems.length, skipped, channelHandle: CHANNEL_HANDLE };
}
