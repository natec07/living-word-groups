import { z } from "zod";

export const reportTargetTypes = ["POST", "COMMENT", "MESSAGE", "PROFILE", "VIDEO"] as const;
export const reportReasons = [
  "HARASSMENT",
  "SPAM",
  "INAPPROPRIATE_CONTENT",
  "SAFETY_CONCERN",
  "FALSE_INFORMATION",
  "PRIVACY_CONCERN",
  "OTHER",
] as const;

export const reportSchema = z.object({
  targetType: z.enum(reportTargetTypes),
  targetId: z.string(),
  reason: z.enum(reportReasons),
  details: z.string().trim().max(2000).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;
