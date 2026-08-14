import { z } from "zod";

export const ageRanges = ["CHILD", "YOUTH", "YOUNG_ADULT", "ADULT", "SENIOR"] as const;

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  bio: z.string().trim().max(500).optional(),
  ageRange: z.enum(ageRanges).optional(),
  preferredLanguage: z.string().max(30).optional(),
  birthdayMonth: z.number().int().min(1).max(12).optional(),
  birthdayDay: z.number().int().min(1).max(31).optional(),
  ministryInterests: z.array(z.string()),
  serveInterests: z.array(z.string()),
  visibility: z.record(z.string(), z.enum(["PUBLIC", "MEMBERS", "PRIVATE"])),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
