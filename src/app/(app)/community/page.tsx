import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCommunityFeedPosts, type FeedSort } from "@/server/data/feed";
import { getLeaderGroupAndSpaceIds, getEffectivePermissions } from "@/lib/authz";
import { PostCard } from "@/components/posts/post-card";
import { PostComposer } from "@/components/posts/post-composer";
import { FeedSortTabs } from "@/components/posts/feed-sort-tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { postTypes } from "@/lib/validations/post";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; compose?: string; type?: string }>;
}) {
  const { sort: sortParam, compose, type } = await searchParams;
  const sort = (["recommended", "newest", "active"].includes(sortParam ?? "") ? sortParam : "newest") as FeedSort;

  const session = await auth();
  const userId = session!.user.id;

  const [churchWideSpace, permissions, leaderIds, posts, bookmarks] = await Promise.all([
    prisma.space.findUnique({ where: { slug: "church-wide" } }),
    getEffectivePermissions(userId),
    getLeaderGroupAndSpaceIds(userId),
    getCommunityFeedPosts({ userId, sort }),
    prisma.bookmark.findMany({ where: { userId, type: "POST" }, select: { postId: true } }),
  ]);

  const bookmarkedIds = new Set(bookmarks.map((b) => b.postId));
  const canModerateGlobally = permissions.includes("content.moderate");
  const canPostChurchWide = permissions.includes("announcements.publish_churchwide");

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Community</h1>
          <p className="mt-1 text-muted-foreground">Discussions from every group and space you&apos;re part of.</p>
        </div>
        <FeedSortTabs current={sort} basePath="/community" />
      </div>

      {churchWideSpace && canPostChurchWide && (
        <PostComposer
          spaceId={churchWideSpace.id}
          defaultType={(type as (typeof postTypes)[number]) || "STANDARD"}
          defaultOpen={compose === "1"}
        />
      )}

      <div className="divide-y divide-border/70 border-t border-border/70">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isBookmarked={bookmarkedIds.has(post.id)}
            canModerate={
              canModerateGlobally ||
              post.authorId === userId ||
              (post.groupId ? leaderIds.groupIds.has(post.groupId) : false) ||
              (post.spaceId ? leaderIds.spaceIds.has(post.spaceId) : false)
            }
          />
        ))}
        {posts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No posts yet — join a group or space to see discussions here.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
