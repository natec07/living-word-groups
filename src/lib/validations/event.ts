import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(3000).optional(),
  startAt: z.string().min(1, "Start date/time is required"),
  endAt: z.string().optional(),
  location: z.string().trim().max(200).optional(),
  onlineLink: z.string().trim().max(500).optional(),
  ministryId: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  allowWaitlist: z.boolean(),
  visibility: z.enum(["PUBLIC", "MEMBERS_ONLY", "PRIVATE", "INVITE_ONLY", "HIDDEN"]),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
