"use client";

import { BookmarkToggle } from "@/components/ui/bookmark-toggle";
import { toggleBookmarkPostAction } from "@/server/actions/posts";

export function PostBookmarkButton({ postId, initialSaved }: { postId: string; initialSaved: boolean }) {
  return <BookmarkToggle initialSaved={initialSaved} onToggle={() => toggleBookmarkPostAction(postId)} />;
}
