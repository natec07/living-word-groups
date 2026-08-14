import { z } from "zod";

export const onboardingSchema = z.object({
  agreeToGuidelines: z.literal(true),
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  bio: z.string().trim().max(500).optional(),
  ageRange: z.enum(["CHILD", "YOUTH", "YOUNG_ADULT", "ADULT", "SENIOR"]).optional(),
  ministryInterests: z.array(z.string()).default([]),
  joinGroupIds: z.array(z.string()).default([]),
  notificationFrequency: z.enum(["IMMEDIATE", "DAILY_DIGEST", "OFF"]).default("IMMEDIATE"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
