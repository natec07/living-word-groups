import "server-only";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";
import type { PermissionKey, RoleKeyType } from "@/lib/rbac";

export async function getUserRoleKeys(userId: string): Promise<RoleKeyType[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return rows.map((r) => r.role.key as RoleKeyType);
}

// Canonical, DB-backed permission resolution: role-derived permissions
// unioned with per-user overrides (grants add, revokes subtract). This is
// the function every sensitive server action should call directly rather
// than trusting the (possibly stale) session token.
export async function getEffectivePermissions(userId: string): Promise<PermissionKey[]> {
  const [roleRows, overrideRows] = await Promise.all([
    prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    }),
    prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    }),
  ]);

  const granted = new Set<string>();
  for (const ur of roleRows) {
    for (const rp of ur.role.permissions) {
      granted.add(rp.permission.key);
    }
  }
  for (const override of overrideRows) {
    if (override.granted) granted.add(override.permission.key);
    else granted.delete(override.permission.key);
  }

  return [...granted] as PermissionKey[];
}

/** Throws if there is no signed-in user. Use in server actions / route handlers. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return session.user;
}

/** Throws unless the signed-in user is ACTIVE (not pending, suspended, or deleted). */
export async function requireActiveUser() {
  const user = await requireUser();
  if (user.status !== "ACTIVE") throw new Error("ACCOUNT_NOT_ACTIVE");
  return user;
}

/** Re-checks the permission against the database — never trusts the session token alone. */
export async function requirePermission(key: PermissionKey) {
  const user = await requireActiveUser();
  const permissions = await getEffectivePermissions(user.id);
  if (!permissions.includes(key)) throw new Error("FORBIDDEN");
  return user;
}

export async function isGroupLeader(userId: string, groupId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return membership?.status === "ACTIVE" && (membership.role === "LEADER" || membership.role === "CO_LEADER");
}

export async function isSpaceLeaderOrAdmin(userId: string, spaceId: string) {
  const membership = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId } },
  });
  return membership?.status === "ACTIVE" && (membership.role === "LEADER" || membership.role === "ADMIN");
}

export async function getLeaderGroupAndSpaceIds(userId: string) {
  const [groupRows, spaceRows] = await Promise.all([
    prisma.groupMember.findMany({
      where: { userId, status: "ACTIVE", role: { in: ["LEADER", "CO_LEADER"] } },
      select: { groupId: true },
    }),
    prisma.spaceMember.findMany({
      where: { userId, status: "ACTIVE", role: { in: ["LEADER", "ADMIN"] } },
      select: { spaceId: true },
    }),
  ]);
  return {
    groupIds: new Set(groupRows.map((r) => r.groupId)),
    spaceIds: new Set(spaceRows.map((r) => r.spaceId)),
  };
}

export async function isMinistryLeader(userId: string, ministryId: string) {
  const row = await prisma.ministryLeader.findUnique({
    where: { ministryId_userId: { ministryId, userId } },
  });
  return !!row;
}

export async function logAudit(params: {
  actorId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}
