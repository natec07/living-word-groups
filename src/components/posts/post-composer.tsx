"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPostAction } from "@/server/actions/posts";
import type { postTypes } from "@/lib/validations/post";

type PostType = (typeof postTypes)[number];

const TYPE_OPTIONS: { value: PostType; label: string }[] = [
  { value: "STANDARD", label: "Post" },
  { value: "QUESTION", label: "Discussion" },
  { value: "PRAISE_REPORT", label: "Praise report" },
  { value: "ANNOUNCEMENT", label: "Announcement" },
  { value: "PHOTO", label: "Photo" },
];

export function PostComposer({
  spaceId,
  groupId,
  defaultType = "STANDARD",
  defaultOpen = false,
  placeholder = "Share something with your community…",
  canAnnounce = true,
  fixedType,
}: {
  spaceId?: string;
  groupId?: string;
  defaultType?: PostType;
  defaultOpen?: boolean;
  placeholder?: string;
  /** Whether "Announcement" should be offered as a post type — only
   * group leaders (or staff) can send one, since it's what surfaces on
   * the Community tab for the whole group. Always true outside groups. */
  canAnnounce?: boolean;
  /** Locks the composer to a single post type and hides the type picker
   * entirely — used for the group leader "Post an announcement" action,
   * which has nothing else it could be. */
  fixedType?: PostType;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const typeOptions = canAnnounce ? TYPE_OPTIONS : TYPE_OPTIONS.filter((opt) => opt.value !== "ANNOUNCEMENT");
  const [type, setType] = useState<PostType>(fixedType ?? (defaultType === "ANNOUNCEMENT" && !canAnnounce ? "STANDARD" : defaultType));
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-border bg-card p-4 text-left text-muted-foreground transition-colors hover:border-primary/40"
      >
        {placeholder}
      </button>
    );
  }

  function submit() {
    if (!body.trim()) return;
    startTransition(async () => {
      // An uncaught server-action rejection here takes down the whole route
      // with "A server error occurred" and loses the drafted post — surface it
      // as a toast and keep the composer open with the text intact instead.
      try {
        await createPostAction({ spaceId, groupId, type: fixedType ?? type, title: title || undefined, body });
      } catch {
        toast.error("Couldn't publish that post. Please try again.");
        return;
      }
      setBody("");
      setTitle("");
      setOpen(false);
      toast.success("Posted!");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      {!fixedType && (
        <Select items={typeOptions} value={type} onValueChange={(v) => setType(v as PostType)}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea
        placeholder={placeholder}
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={pending || !body.trim()}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </div>
    </div>
  );
}
