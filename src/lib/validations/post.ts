import { z } from "zod";

export const postTypes = [
  "STANDARD",
  "QUESTION",
  "TESTIMONY",
  "PRAISE_REPORT",
  "ANNOUNCEMENT",
  "PHOTO",
  "LINK",
  "RESOURCE",
] as const;

export const createPostSchema = z.object({
  spaceId: z.string().optional(),
  groupId: z.string().optional(),
  type: z.enum(postTypes).default("STANDARD"),
  title: z.string().trim().max(140).optional(),
  body: z.string().trim().min(1, "Say something first.").max(8000),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCommentSchema = z.object({
  postId: z.string(),
  parentId: z.string().optional(),
  body: z.string().trim().min(1).max(3000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const reactionTypes = ["AMEN", "PRAISE_GOD", "PRAYING", "ENCOURAGED", "LOVE"] as const;
