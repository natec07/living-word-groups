import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { postInclude } from "@/server/data/feed";
import { PostCard } from "@/components/posts/post-card";
import { getEffectivePermissions, getLeaderGroupAndSpaceIds } from "@/lib/authz";

export default async function SavedPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [postBookmarks, permissions, leaderIds] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId, type: "POST" },
      include: { post: { include: postInclude(userId) } },
      orderBy: { createdAt: "desc" },
    }),
    getEffectivePermissions(userId),
    getLeaderGroupAndSpaceIds(userId),
  ]);

  const canModerateGlobally = permissions.includes("content.moderate");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Saved</h1>
      <p className="mt-1 text-muted-foreground">Posts you&apos;ve bookmarked for later.</p>

      <div className="mt-6 space-y-4">
        {postBookmarks
          .filter((b) => b.post)
          .map((b) => (
            <PostCard
              key={b.id}
              post={b.post!}
              isBookmarked
              canModerate={
                canModerateGlobally ||
                b.post!.authorId === userId ||
                (b.post!.groupId ? leaderIds.groupIds.has(b.post!.groupId) : false) ||
                (b.post!.spaceId ? leaderIds.spaceIds.has(b.post!.spaceId) : false)
              }
            />
          ))}
        {postBookmarks.length === 0 && <p className="text-muted-foreground">No saved posts yet.</p>}
      </div>
    </div>
  );
}
