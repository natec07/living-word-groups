"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/authz";
import { createVideoSchema, createSeriesSchema, slugify, type CreateVideoInput, type CreateSeriesInput } from "@/lib/validations/media";
import { syncYouTubeSermons } from "@/lib/youtube";

function thumbnailFor(provider: string, providerRef: string) {
  if (provider === "YOUTUBE") return `https://i.ytimg.com/vi/${providerRef}/hqdefault.jpg`;
  return null;
}

export async function createVideoAction(input: CreateVideoInput) {
  const admin = await requirePermission("media.manage");
  const parsed = createVideoSchema.parse(input);

  const baseSlug = slugify(parsed.title);
  let slug = baseSlug;
  let n = 1;
  while (await prisma.video.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const video = await prisma.video.create({
    data: {
      title: parsed.title,
      slug,
      description: parsed.description,
      provider: parsed.provider,
      providerRef: parsed.providerRef,
      thumbnailUrl: thumbnailFor(parsed.provider, parsed.providerRef),
      speakerId: parsed.speakerId || undefined,
      ministryId: parsed.ministryId || undefined,
      durationSeconds: parsed.durationSeconds,
      datePreached: parsed.datePreached ? new Date(parsed.datePreached) : undefined,
      scriptureRefs: parsed.scriptureRefs ? parsed.scriptureRefs.split(",").map((s) => s.trim()).filter(Boolean) : [],
      topics: parsed.topics ? parsed.topics.split(",").map((s) => s.trim()).filter(Boolean) : [],
      visibility: parsed.visibility,
    },
  });

  if (parsed.seriesId) {
    const count = await prisma.videoSeriesItem.count({ where: { seriesId: parsed.seriesId } });
    await prisma.videoSeriesItem.create({ data: { seriesId: parsed.seriesId, videoId: video.id, order: parsed.seriesOrder ?? count } });
  }

  await logAudit({ actorId: admin.id, action: "video.created", targetType: "Video", targetId: video.id });
  revalidatePath("/admin/media");
  revalidatePath("/watch");
  return video.id;
}

export async function deleteVideoAction(videoId: string) {
  const admin = await requirePermission("media.manage");
  await prisma.video.delete({ where: { id: videoId } });
  await logAudit({ actorId: admin.id, action: "video.deleted", targetType: "Video", targetId: videoId });
  revalidatePath("/admin/media");
}

export async function createSeriesAction(input: CreateSeriesInput) {
  const admin = await requirePermission("media.manage");
  const parsed = createSeriesSchema.parse(input);

  const baseSlug = slugify(parsed.title);
  let slug = baseSlug;
  let n = 1;
  while (await prisma.videoSeries.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const series = await prisma.videoSeries.create({
    data: {
      title: parsed.title,
      slug,
      description: parsed.description,
      speakerId: parsed.speakerId || undefined,
      ministryId: parsed.ministryId || undefined,
      visibility: parsed.visibility,
    },
  });

  await logAudit({ actorId: admin.id, action: "series.created", targetType: "VideoSeries", targetId: series.id });
  revalidatePath("/admin/media");
  return series.id;
}

export async function syncYouTubeSermonsAction() {
  const admin = await requirePermission("media.manage");
  const result = await syncYouTubeSermons();
  await logAudit({
    actorId: admin.id,
    action: "video.youtube_synced",
    metadata: { imported: result.imported, skipped: result.skipped, channelHandle: result.channelHandle },
  });
  revalidatePath("/admin/media");
  revalidatePath("/watch");
  return result;
}
