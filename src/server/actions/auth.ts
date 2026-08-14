"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validations/auth";
import { sendWelcomeEmail } from "@/lib/email/send";
import { logAudit } from "@/lib/authz";

export type RegisterResult = { success: true } | { success: false; error: string };

export async function registerAction(formData: FormData): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    agreeToGuidelines: formData.get("agreeToGuidelines") === "on",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check your details and try again." };
  }

  const { firstName, lastName, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // Deliberately vague to avoid leaking account existence.
    return { success: false, error: "We couldn't create your account with those details. Try signing in instead." };
  }

  const hashedPassword = await hashPassword(password);
  const memberRole = await prisma.role.findUnique({ where: { key: "MEMBER" } });

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: `${firstName} ${lastName}`,
      hashedPassword,
      status: "PENDING_APPROVAL",
      profile: {
        create: { firstName, lastName },
      },
      ...(memberRole
        ? { roles: { create: [{ roleId: memberRole.id }] } }
        : {}),
    },
  });

  await logAudit({ actorId: null, action: "user.registered", targetType: "User", targetId: user.id });
  await sendWelcomeEmail(user.email, firstName);

  return { success: true };
}
