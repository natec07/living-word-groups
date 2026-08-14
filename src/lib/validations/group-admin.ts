import { z } from "zod";

export const groupPrivacyLevels = ["OPEN", "APPROVAL_REQUIRED", "INVITE_ONLY", "HIDDEN"] as const;
export const groupAgeRanges = ["CHILD", "YOUTH", "YOUNG_ADULT", "ADULT", "SENIOR"] as const;

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional(),
  meetingSchedule: z.string().trim().max(200).optional(),
  location: z.string().trim().max(200).optional(),
  onlineLink: z.string().trim().max(500).optional(),
  privacy: z.enum(groupPrivacyLevels),
  ageRestriction: z.enum(groupAgeRanges).optional(),
  rules: z.string().trim().max(2000).optional(),
  spaceId: z.string().optional(),
  leaderId: z.string().optional(),
  questions: z.array(z.string().trim().min(1)),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const spaceTypes = ["CHURCH_WIDE", "MINISTRY", "GROUP_HUB", "EVENT_TEMP"] as const;
export const spacePrivacyLevels = ["PUBLIC", "MEMBERS_ONLY", "PRIVATE", "INVITE_ONLY", "HIDDEN"] as const;

export const createSpaceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(spaceTypes),
  privacy: z.enum(spacePrivacyLevels),
  ministryId: z.string().optional(),
  guidelines: z.string().trim().max(2000).optional(),
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
