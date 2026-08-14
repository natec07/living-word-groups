"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentForm } from "@/components/posts/comment-form";
import { formatRelative, initials } from "@/lib/format";

type CommentData = {
  id: string;
  body: string;
  createdAt: Date;
  author: { name: string; avatarUrl?: string | null; firstName?: string | null; lastName?: string | null };
  replies: CommentData[];
};

export function CommentItem({ postId, comment, depth = 0 }: { postId: string; comment: CommentData; depth?: number }) {
  const [replying, setReplying] = useState(false);

  return (
    <div className={depth > 0 ? "ml-8 border-l border-border pl-4" : ""}>
      <div className="flex gap-3 py-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatarUrl ?? undefined} alt="" />
          <AvatarFallback>{initials(comment.author.firstName, comment.author.lastName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="rounded-xl bg-secondary/40 px-3 py-2">
            <p className="text-sm font-medium">{comment.author.name}</p>
            <p className="text-sm text-foreground/90 whitespace-pre-line">{comment.body}</p>
          </div>
          <div className="mt-1 flex items-center gap-3 px-1 text-xs text-muted-foreground">
            <span>{formatRelative(comment.createdAt)}</span>
            {depth === 0 && (
              <button onClick={() => setReplying((r) => !r)} className="font-medium hover:text-foreground">
                Reply
              </button>
            )}
          </div>
          {replying && (
            <div className="mt-2">
              <CommentForm postId={postId} parentId={comment.id} onDone={() => setReplying(false)} autoFocus />
            </div>
          )}
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} postId={postId} comment={reply} depth={depth + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
