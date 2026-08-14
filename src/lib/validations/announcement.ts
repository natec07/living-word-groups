import { z } from "zod";

export const announcementTargets = [
  "EVERYONE",
  "GROUP",
  "MINISTRY",
  "ROLE",
  "AGE_RANGE",
  "EVENT_REGISTRANTS",
  "NEW_MEMBERS",
  "VOLUNTEERS",
] as const;

export const announcementPriorities = ["NORMAL", "IMPORTANT", "URGENT"] as const;

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1).max(140),
  body: z.string().trim().min(1).max(3000),
  targetType: z.enum(announcementTargets),
  targetId: z.string().optional(),
  priority: z.enum(announcementPriorities),
  pinned: z.boolean(),
  requiresAck: z.boolean(),
  sendEmail: z.boolean(),
  expiresAt: z.string().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
