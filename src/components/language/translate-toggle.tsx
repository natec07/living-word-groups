"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { translateTextAction } from "@/server/actions/translate";
import { usePreferredLanguage } from "@/components/language/preferred-language-context";
import { cn } from "@/lib/utils";

// Renders the given text, plus a small "Translate" action underneath.
// Tapping it translates in place to the viewer's preferred language
// (Settings → Preferred language); tapping again flips back to the
// original. Nothing is translated automatically — this only ever runs on
// an explicit tap, so DeepL usage stays bounded to what's actually asked
// for.
export function TranslateToggle({ text, className }: { text: string; className?: string }) {
  const preferredLanguage = usePreferredLanguage();
  const [translated, setTranslated] = useState<string | null>(null);
  const [showingTranslation, setShowingTranslation] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (showingTranslation) {
      setShowingTranslation(false);
      return;
    }
    if (translated) {
      setShowingTranslation(true);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await translateTextAction(text, preferredLanguage);
      setTranslated(result);
      setShowingTranslation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't translate — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={className}>
      <p className="whitespace-pre-line">{showingTranslation && translated ? translated : text}</p>
      <button
        type="button"
        onClick={(e) => {
          // TranslateToggle is often nested inside a card that links
          // elsewhere on click (e.g. a post card linking to its detail
          // page) — this must never trigger that outer navigation.
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        disabled={pending}
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
        <span className={cn(showingTranslation && "underline")}>{showingTranslation ? "See original" : "Translate"}</span>
      </button>
      {error && <p className="mt-0.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
