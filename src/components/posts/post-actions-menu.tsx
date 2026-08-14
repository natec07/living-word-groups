"use client";

import { useTransition } from "react";
import { MoreHorizontal, Pin, PinOff, Trash2, Flag } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deletePostAction, togglePinPostAction } from "@/server/actions/posts";
import { reportContentAction } from "@/server/actions/moderation";

export function PostActionsMenu({
  postId,
  canModerate,
  pinned,
}: {
  postId: string;
  canModerate: boolean;
  pinned: boolean;
}) {
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        aria-label="Post options"
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canModerate && (
          <>
            <DropdownMenuItem onClick={() => startTransition(() => togglePinPostAction(postId))}>
              {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              {pinned ? "Unpin" : "Pin post"}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                startTransition(async () => {
                  await deletePostAction(postId);
                  toast.success("Post removed");
                })
              }
            >
              <Trash2 className="h-4 w-4" /> Remove post
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={() =>
            startTransition(async () => {
              await reportContentAction({ targetType: "POST", targetId: postId, reason: "OTHER" });
              toast.success("Thanks — our team will review this.");
            })
          }
        >
          <Flag className="h-4 w-4" /> Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
