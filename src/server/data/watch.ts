import "server-only";
import type { Session } from "next-auth";
import type { Prisma } from "@/generated/prisma/client";

// Centralizes video/series visibility so no page can accidentally leak
// non-public content to guests or leak staff-only content to regular
// members.
export function visibleVideoWhere(session: Session | null): Prisma.VideoWhereInput {
  const isActiveMember = session?.user && session.user.status === "ACTIVE";
  if (!isActiveMember) return { visibility: "PUBLIC" };

  const canSeeStaffOnly = session!.user.permissions.includes("media.manage");
  if (canSeeStaffOnly) return {};

  return { visibility: { in: ["PUBLIC", "MEMBERS_ONLY"] } };
}
