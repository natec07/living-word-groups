"use server";

import { prisma } from "@/lib/prisma";
import { requireActiveUser, logAudit } from "@/lib/authz";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sendVerificationCodeEmail } from "@/lib/email/send";
import {
  requestEmailChangeSchema,
  requestPasswordChangeSchema,
  verifyCodeSchema,
  type RequestEmailChangeInput,
  type RequestPasswordChangeInput,
  type VerifyCodeInput,
} from "@/lib/validations/security";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createChangeRequest(userId: string, type: "EMAIL" | "PASSWORD", newValue: string) {
  // Only one pending request per type at a time — starting a new one
  // supersedes whatever code was issued before.
  await prisma.accountChangeRequest.deleteMany({ where: { userId, type } });
  const code = generateCode();
  const codeHash = await hashPassword(code);
  await prisma.accountChangeRequest.create({
    data: { userId, type, newValue, codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000) },
  });
  return code;
}

async function consumeChangeRequest(userId: string, type: "EMAIL" | "PASSWORD", code: string) {
  const request = await prisma.accountChangeRequest.findFirst({
    where: { userId, type },
    orderBy: { createdAt: "desc" },
  });
  if (!request || request.expiresAt < new Date()) throw new Error("That code has expired — request a new one.");
  if (request.attempts >= MAX_ATTEMPTS) throw new Error("Too many attempts — request a new code.");

  const valid = await verifyPassword(code, request.codeHash);
  if (!valid) {
    await prisma.accountChangeRequest.update({ where: { id: request.id }, data: { attempts: { increment: 1 } } });
    throw new Error("That code isn't right — try again.");
  }

  await prisma.accountChangeRequest.delete({ where: { id: request.id } });
  return request.newValue;
}

export async function requestEmailChangeAction(input: RequestEmailChangeInput) {
  const user = await requireActiveUser();
  const parsed = requestEmailChangeSchema.parse(input);

  if (parsed.newEmail === user.email.toLowerCase()) throw new Error("That's already your email address.");
  const existing = await prisma.user.findUnique({ where: { email: parsed.newEmail } });
  if (existing) throw new Error("That email is already in use.");

  const code = await createChangeRequest(user.id, "EMAIL", parsed.newEmail);
  await sendVerificationCodeEmail(parsed.newEmail, code, "changing your email address");
}

export async function verifyEmailChangeAction(input: VerifyCodeInput) {
  const user = await requireActiveUser();
  const { code } = verifyCodeSchema.parse(input);

  const newEmail = await consumeChangeRequest(user.id, "EMAIL", code);
  await prisma.user.update({ where: { id: user.id }, data: { email: newEmail, emailVerified: new Date() } });
  await logAudit({ actorId: user.id, action: "user.email_changed", targetType: "User", targetId: user.id });
}

export async function requestPasswordChangeAction(input: RequestPasswordChangeInput) {
  const user = await requireActiveUser();
  const parsed = requestPasswordChangeSchema.parse(input);

  const fullUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!fullUser.hashedPassword || !(await verifyPassword(parsed.currentPassword, fullUser.hashedPassword))) {
    throw new Error("Your current password is incorrect.");
  }

  const newHashedPassword = await hashPassword(parsed.newPassword);
  const code = await createChangeRequest(user.id, "PASSWORD", newHashedPassword);
  await sendVerificationCodeEmail(fullUser.email, code, "changing your password");
}

export async function verifyPasswordChangeAction(input: VerifyCodeInput) {
  const user = await requireActiveUser();
  const { code } = verifyCodeSchema.parse(input);

  const newHashedPassword = await consumeChangeRequest(user.id, "PASSWORD", code);
  await prisma.user.update({ where: { id: user.id }, data: { hashedPassword: newHashedPassword } });
  await logAudit({ actorId: user.id, action: "user.password_changed", targetType: "User", targetId: user.id });
}

export async function requestAccountDeletionAction() {
  const user = await requireActiveUser();
  await logAudit({ actorId: user.id, action: "user.deletion_requested", targetType: "User", targetId: user.id });
  // A staff member reviews and completes deletion from the admin panel —
  // we don't hard-delete immediately so pastoral follow-up is possible
  // and so shared content (comments, posts) can be handled deliberately.
}
