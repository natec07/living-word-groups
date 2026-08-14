import "server-only";
import { prisma } from "@/lib/prisma";
import { getEffectivePermissions } from "@/lib/authz";
import { getVisibleSpaceAndGroupIds } from "@/server/data/feed";
import type { Prisma } from "@/generated/prisma/client";

// The single source of truth for "who can see this prayer request."
// CONFIDENTIAL and PASTORAL_STAFF requests are only ever included when
// the caller holds prayer.view_confidential — this function is the only
// place that decision is made, so every prayer list/detail query must
// route through it rather than re-deriving visibility inline.
export async function getVisiblePrayerWhere(userId: string): Promise<Prisma.PrayerRequestWhereInput> {
  const [permissions, { groupIds }, isTeamMember] = await Promise.all([
    getEffectivePermissions(userId),
    getVisibleSpaceAndGroupIds(userId),
    isPrayerTeamMember(userId),
  ]);

  const canViewConfidential = permissions.includes("prayer.view_confidential");
  const canViewPrayerTeam = isTeamMember || canViewConfidential;

  const clauses: Prisma.PrayerRequestWhereInput[] = [{ authorId: userId }, { privacy: "PUBLIC" }, { privacy: "ANONYMOUS" }];

  if (groupIds.length) clauses.push({ privacy: "GROUP", groupId: { in: groupIds } });
  if (canViewPrayerTeam) clauses.push({ privacy: "PRAYER_TEAM" });
  if (canViewConfidential) clauses.push({ privacy: "PASTORAL_STAFF" }, { privacy: "CONFIDENTIAL" });

  return { OR: clauses };
}

export async function canViewConfidentialPrayer(userId: string) {
  const permissions = await getEffectivePermissions(userId);
  return permissions.includes("prayer.view_confidential");
}

export async function canManagePrayerTeam(userId: string) {
  const permissions = await getEffectivePermissions(userId);
  return permissions.includes("prayer.manage_prayer_team") || permissions.includes("prayer.view_confidential");
}

// Prayer Team access is membership-based, not purely role-based: a plain
// MEMBER added to the seeded "Prayer Team" group (slug prayer-team) should
// see the wall even without the admin/pastor role permission, and staff
// always have access regardless of whether they were added to the group.
export async function isPrayerTeamMember(userId: string) {
  const [canManage, membership] = await Promise.all([
    canManagePrayerTeam(userId),
    prisma.groupMember.findFirst({
      where: { userId, status: "ACTIVE", group: { slug: "prayer-team" } },
      select: { id: true },
    }),
  ]);
  return canManage || !!membership;
}
