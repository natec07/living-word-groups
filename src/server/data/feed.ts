import "server-only";
import { prisma } from "@/lib/prisma";

export type FeedSort = "recommended" | "newest" | "active";

export async function getVisibleSpaceAndGroupIds(userId: string) {
  const [spaceMemberships, groupMemberships] = await Promise.all([
    prisma.spaceMember.findMany({ where: { userId, status: "ACTIVE" }, select: { spaceId: true } }),
    prisma.groupMember.findMany({ where: { userId, status: "ACTIVE" }, select: { groupId: true } }),
  ]);
  return {
    spaceIds: spaceMemberships.map((m) => m.spaceId),
    groupIds: groupMemberships.map((m) => m.groupId),
  };
}

export const postInclude = (userId: string) => ({
  author: { include: { profile: true } },
  space: { select: { id: true, name: true, slug: true } },
  group: { select: { id: true, name: true, slug: true } },
  attachments: true,
  _count: { select: { comments: true, reactions: true } },
  reactions: { where: { userId }, select: { type: true } },
});

export async function getFeedPosts(params: {
  userId: string;
  sort?: FeedSort;
  spaceId?: string;
  groupId?: string;
  take?: number;
  skip?: number;
}) {
  const { userId, sort = "newest", spaceId, groupId, take = 20, skip = 0 } = params;

  let where: Record<string, unknown> = { status: "PUBLISHED" };

  if (groupId) {
    where = { ...where, groupId };
  } else if (spaceId) {
    where = { ...where, spaceId };
  } else {
    const { spaceIds, groupIds } = await getVisibleSpaceAndGroupIds(userId);
    where = {
      ...where,
      OR: [{ spaceId: { in: spaceIds } }, { groupId: { in: groupIds } }],
    };
  }

  const orderBy =
    sort === "active"
      ? [{ pinned: "desc" as const }, { reactions: { _count: "desc" as const } }]
      : sort === "recommended"
        ? [{ pinned: "desc" as const }, { publishedAt: "desc" as const }]
        : [{ pinned: "desc" as const }, { publishedAt: "desc" as const }];

  const posts = await prisma.post.findMany({
    where,
    include: postInclude(userId),
    orderBy,
    take,
    skip,
  });

  return posts;
}

export type FeedPost = Awaited<ReturnType<typeof getFeedPosts>>[number];

// The Community tab is church-wide, staff-authored content plus group
// announcements — not every post from every group/space a user belongs
// to (that broader mix is what the Home feed shows). A post surfaces
// here only if it's on the church-wide space, or it's an ANNOUNCEMENT
// from a group the viewer is an active member of.
export async function getCommunityFeedPosts(params: { userId: string; sort?: FeedSort; take?: number; skip?: number }) {
  const { userId, sort = "newest", take = 20, skip = 0 } = params;

  const [churchWideSpace, { groupIds }] = await Promise.all([
    prisma.space.findUnique({ where: { slug: "church-wide" }, select: { id: true } }),
    getVisibleSpaceAndGroupIds(userId),
  ]);

  const orClauses: Record<string, unknown>[] = [];
  if (churchWideSpace) orClauses.push({ spaceId: churchWideSpace.id });
  if (groupIds.length) orClauses.push({ type: "ANNOUNCEMENT", groupId: { in: groupIds } });

  if (orClauses.length === 0) return [];

  const where: Record<string, unknown> = { status: "PUBLISHED", OR: orClauses };

  const orderBy =
    sort === "active"
      ? [{ pinned: "desc" as const }, { reactions: { _count: "desc" as const } }]
      : [{ pinned: "desc" as const }, { publishedAt: "desc" as const }];

  return prisma.post.findMany({ where, include: postInclude(userId), orderBy, take, skip });
}
