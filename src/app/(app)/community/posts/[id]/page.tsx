import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePermissions } from "@/lib/authz";
import { PostCard } from "@/components/posts/post-card";
import { CommentForm } from "@/components/posts/comment-form";
import { CommentItem } from "@/components/posts/comment-item";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const post = await prisma.post.findUnique({
    where: { id, status: "PUBLISHED" },
    include: {
      author: { include: { profile: true } },
      space: { select: { id: true, name: true, slug: true } },
      group: { select: { id: true, name: true, slug: true } },
      attachments: true,
      _count: { select: { comments: true, reactions: true } },
      reactions: { where: { userId }, select: { type: true } },
    },
  });
  if (!post) notFound();

  await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  const [permissions, comments, isBookmarked] = await Promise.all([
    getEffectivePermissions(userId),
    prisma.comment.findMany({
      where: { postId: id, parentId: null, status: "PUBLISHED" },
      include: {
        author: { include: { profile: true } },
        replies: {
          where: { status: "PUBLISHED" },
          include: { author: { include: { profile: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.bookmark.findFirst({ where: { userId, postId: id, type: "POST" } }).then(Boolean),
  ]);

  type CommentData = {
    id: string;
    body: string;
    createdAt: Date;
    author: { name: string; avatarUrl?: string | null; firstName?: string | null; lastName?: string | null };
    replies: CommentData[];
  };

  function toCommentData(c: (typeof comments)[number] | (typeof comments)[number]["replies"][number]): CommentData {
    return {
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      author: {
        name: c.author.profile ? `${c.author.profile.firstName} ${c.author.profile.lastName}` : c.author.name || "Member",
        avatarUrl: c.author.profile?.avatarUrl,
        firstName: c.author.profile?.firstName,
        lastName: c.author.profile?.lastName,
      },
      replies: "replies" in c ? c.replies.map((r) => toCommentData(r)) : [],
    };
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <PostCard
        post={post}
        isBookmarked={isBookmarked}
        canModerate={permissions.includes("content.moderate") || post.authorId === userId}
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Comments</h2>
        {!post.commentsLocked && <CommentForm postId={post.id} placeholder="Add a comment…" />}
        {post.commentsLocked && <p className="text-sm text-muted-foreground">Comments are locked on this post.</p>}
        <div className="mt-2 divide-y divide-border">
          {comments.map((c) => (
            <CommentItem key={c.id} postId={post.id} comment={toCommentData(c)} />
          ))}
        </div>
        {comments.length === 0 && <p className="mt-4 text-muted-foreground">Be the first to comment.</p>}
      </div>
    </div>
  );
}
