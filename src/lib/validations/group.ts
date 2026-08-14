import { z } from "zod";

export const joinGroupSchema = z.object({
  groupId: z.string(),
  answers: z.array(z.object({ questionId: z.string(), answer: z.string().trim().max(1000) })).default([]),
});

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
