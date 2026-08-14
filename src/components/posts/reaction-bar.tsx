"use client";

import { useOptimistic, useTransition } from "react";
import { HandHeart, Heart, PartyPopper, Sparkles, Hand } from "lucide-react";
import { reactToPostAction } from "@/server/actions/posts";
import { cn } from "@/lib/utils";
import type { reactionTypes } from "@/lib/validations/post";

type ReactionType = (typeof reactionTypes)[number];

const REACTIONS: { type: ReactionType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "AMEN", label: "Amen", icon: Hand },
  { type: "PRAISE_GOD", label: "Praise God", icon: Sparkles },
  { type: "PRAYING", label: "Praying", icon: HandHeart },
  { type: "ENCOURAGED", label: "Encouraged", icon: PartyPopper },
  { type: "LOVE", label: "Love", icon: Heart },
];

export function ReactionBar({
  postId,
  myReactions,
  totalCount,
}: {
  postId: string;
  myReactions: ReactionType[];
  totalCount: number;
}) {
  const [, startTransition] = useTransition();
  const [optimisticMine, setOptimisticMine] = useOptimistic(myReactions);

  function toggle(type: ReactionType) {
    startTransition(async () => {
      setOptimisticMine((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
      await reactToPostAction(postId, type);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {REACTIONS.map(({ type, label, icon: Icon }) => {
        const active = optimisticMine.includes(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => toggle(type)}
            aria-pressed={active}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
      {totalCount > 0 && <span className="ml-1 text-xs text-muted-foreground">{totalCount}</span>}
    </div>
  );
}
