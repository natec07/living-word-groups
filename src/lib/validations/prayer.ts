import { z } from "zod";

export const prayerCategories = [
  "HEALTH",
  "FAMILY",
  "FINANCES",
  "GUIDANCE",
  "SALVATION",
  "GRIEF",
  "RELATIONSHIPS",
  "WORK",
  "SPIRITUAL_GROWTH",
  "OTHER",
] as const;

export const prayerUrgencies = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const prayerPrivacyLevels = [
  "PUBLIC",
  "GROUP",
  "PRAYER_TEAM",
  "PASTORAL_STAFF",
  "ANONYMOUS",
  "CONFIDENTIAL",
] as const;

export const createPrayerRequestSchema = z.object({
  title: z.string().trim().min(1, "Give your request a short title").max(120),
  details: z.string().trim().min(1, "Share a few details").max(3000),
  category: z.enum(prayerCategories),
  urgency: z.enum(prayerUrgencies),
  privacy: z.enum(prayerPrivacyLevels),
  concealName: z.boolean(),
  groupId: z.string().optional(),
});

export type CreatePrayerRequestInput = z.infer<typeof createPrayerRequestSchema>;
