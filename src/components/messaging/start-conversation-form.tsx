"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { startConversationAction } from "@/server/actions/messaging";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

type Member = { userId: string; firstName: string; lastName: string; avatarUrl: string | null };

export function StartConversationForm({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const results = query
    ? members.filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  function submit() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      try {
        await startConversationAction(selected.userId, body);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't start that conversation.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {!selected ? (
        <div>
          <Input placeholder="Search for a member…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="mt-2 space-y-1">
            {results.map((m) => (
              <button
                key={m.userId}
                onClick={() => setSelected(m)}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-2.5 text-left hover:border-primary/40"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback>{initials(m.firstName, m.lastName)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{m.firstName} {m.lastName}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={cn("flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3")}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={selected.avatarUrl ?? undefined} alt="" />
            <AvatarFallback>{initials(selected.firstName, selected.lastName)}</AvatarFallback>
          </Avatar>
          <span className="flex-1 text-sm font-medium">{selected.firstName} {selected.lastName}</span>
          <button onClick={() => setSelected(null)} className="text-sm text-muted-foreground hover:text-foreground">
            Change
          </button>
        </div>
      )}

      <Textarea rows={4} placeholder="Write your message…" value={body} onChange={(e) => setBody(e.target.value)} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={submit} disabled={!selected || !body.trim() || pending}>
        {pending ? "Sending…" : "Send"}
      </Button>
    </div>
  );
}
