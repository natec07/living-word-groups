import { z } from "zod";

export const requestEmailChangeSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export type RequestEmailChangeInput = z.infer<typeof requestEmailChangeSchema>;

export const requestPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
});

export type RequestPasswordChangeInput = z.infer<typeof requestPasswordChangeSchema>;

export const verifyCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
