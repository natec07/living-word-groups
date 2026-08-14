"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/authz";
import { sendAccountApprovedEmail } from "@/lib/email/send";
import type { RoleKeyType } from "@/lib/rbac";

export async function approveUserAction(userId: string) {
  const admin = await requirePermission("users.manage");
  const user = await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  await logAudit({ actorId: admin.id, action: "user.approved", targetType: "User", targetId: userId });
  await sendAccountApprovedEmail(user.email, user.name ?? "there", `${process.env.NEXT_PUBLIC_APP_URL}/home`);
  revalidatePath("/admin/users");
}

export async function suspendUserAction(userId: string) {
  const admin = await requirePermission("users.manage");
  await prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  await logAudit({ actorId: admin.id, action: "user.suspended", targetType: "User", targetId: userId });
  revalidatePath("/admin/users");
}

export async function reactivateUserAction(userId: string) {
  const admin = await requirePermission("users.manage");
  await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  await logAudit({ actorId: admin.id, action: "user.reactivated", targetType: "User", targetId: userId });
  revalidatePath("/admin/users");
}

export async function resetOnboardingAction(userId: string) {
  const admin = await requirePermission("users.manage");
  await prisma.user.update({ where: { id: userId }, data: { onboardedAt: null } });
  await logAudit({ actorId: admin.id, action: "user.onboarding_reset", targetType: "User", targetId: userId });
  revalidatePath(`/admin/users/${userId}`);
}

export async function assignRoleAction(userId: string, roleKey: RoleKeyType, grant: boolean) {
  const admin = await requirePermission("roles.manage");
  const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });

  if (grant) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    });
  } else {
    await prisma.userRole.deleteMany({ where: { userId, roleId: role.id } });
  }

  await logAudit({ actorId: admin.id, action: "user.role_changed", targetType: "User", targetId: userId, metadata: { roleKey, grant } });
  revalidatePath(`/admin/users/${userId}`);
}

export async function exportMembersCsvAction() {
  const admin = await requirePermission("users.manage");
  const users = await prisma.user.findMany({
    include: { profile: true, roles: { include: { role: true } } },
    orderBy: { createdAt: "desc" },
  });

  await logAudit({ actorId: admin.id, action: "users.exported" });

  const header = "Name,Email,Status,Roles,Joined\n";
  const rows = users
    .map((u) => {
      const name = u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.name || "";
      const roles = u.roles.map((r) => r.role.key).join("; ");
      return `"${name}","${u.email}","${u.status}","${roles}","${u.createdAt.toISOString()}"`;
    })
    .join("\n");

  return { filename: "members.csv", csv: header + rows };
}
