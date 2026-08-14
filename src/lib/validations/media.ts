import { z } from "zod";

export const videoProviders = ["YOUTUBE", "VIMEO", "MUX", "CLOUDFLARE_STREAM", "HLS"] as const;
export const privacyLevels = ["PUBLIC", "MEMBERS_ONLY", "PRIVATE", "INVITE_ONLY", "HIDDEN"] as const;

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const createVideoSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(3000).optional(),
  provider: z.enum(videoProviders),
  providerRef: z.string().trim().min(1, "Provide the video ID or URL"),
  speakerId: z.string().optional(),
  ministryId: z.string().optional(),
  durationSeconds: z.number().int().positive().optional(),
  datePreached: z.string().optional(),
  scriptureRefs: z.string().optional(),
  topics: z.string().optional(),
  visibility: z.enum(privacyLevels),
  seriesId: z.string().optional(),
  seriesOrder: z.number().int().optional(),
});

export type CreateVideoInput = z.infer<typeof createVideoSchema>;

export const createSeriesSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  speakerId: z.string().optional(),
  ministryId: z.string().optional(),
  visibility: z.enum(privacyLevels),
});

export type CreateSeriesInput = z.infer<typeof createSeriesSchema>;

export { slugify };
