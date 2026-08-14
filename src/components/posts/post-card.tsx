import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReactionBar } from "@/components/posts/reaction-bar";
import { PostBookmarkButton } from "@/components/posts/post-bookmark-button";
import { PostActionsMenu } from "@/components/posts/post-actions-menu";
import { TranslateToggle } from "@/components/language/translate-toggle";
import { formatRelative, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/server/data/feed";

const TYPE_LABELS: Record<string, string> = {
  QUESTION: "Question",
  TESTIMONY: "Testimony",
  PRAISE_REPORT: "Praise Report",
  ANNOUNCEMENT: "Announcement",
  PHOTO: "Photo",
  LINK: "Link",
  RESOURCE: "Resource",
};

export function PostCard({
  post,
  canModerate,
  isBookmarked,
  showContext = true,
}: {
  post: FeedPost;
  canModerate: boolean;
  isBookmarked: boolean;
  showContext?: boolean;
}) {
  const { profile } = post.author;
  const authorName = profile ? `${profile.firstName} ${profile.lastName}` : post.author.name || "Member";
  const myReactionTypes = post.reactions.map((r) => r.type) as Parameters<typeof ReactionBar>[0]["myReactions"];
  const images = post.attachments.filter((a) => a.type === "IMAGE");

  return (
    <article className="flex items-start gap-3 py-5">
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={profile?.avatarUrl ?? undefined} alt="" />
        <AvatarFallback>{initials(profile?.firstName, profile?.lastName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{authorName}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
              {showContext && (post.group || post.space) && (
                <>
                  <Link
                    href={post.group ? `/groups/${post.group.slug}` : `/community?space=${post.space?.slug}`}
                    className="font-medium text-foreground/75 hover:text-primary hover:underline"
                  >
                    {post.group?.name ?? post.space?.name}
                  </Link>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>{formatRelative(post.publishedAt)}</span>
              {post.pinned && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-primary">Pinned</span>
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {TYPE_LABELS[post.type] && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                {TYPE_LABELS[post.type]}
              </span>
            )}
            <PostActionsMenu postId={post.id} canModerate={canModerate} pinned={post.pinned} />
          </div>
        </div>

        <Link href={`/community/posts/${post.id}`} className="mt-2 block">
          {post.title && <h3 className="font-semibold leading-snug">{post.title}</h3>}
          <TranslateToggle text={post.body} className="mt-0.5 text-[15px] leading-relaxed text-foreground/90" />
        </Link>

        {images.length > 0 && (
          <div
            className={cn(
              "mt-3 overflow-hidden rounded-xl bg-muted",
              images.length > 1 && "grid grid-cols-2 gap-0.5",
            )}
          >
            {images.map((a) => (
              <div key={a.id} className="relative aspect-video">
                <Image src={a.url} alt="" fill sizes="(min-width: 768px) 640px, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <ReactionBar postId={post.id} myReactions={myReactionTypes} totalCount={post._count.reactions} />
          <div className="flex items-center gap-1">
            <Link
              href={`/community/posts/${post.id}`}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {post._count.comments}
            </Link>
            <PostBookmarkButton postId={post.id} initialSaved={isBookmarked} />
          </div>
        </div>
      </div>
    </article>
  );
}
