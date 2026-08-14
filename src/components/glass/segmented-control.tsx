"use client";

import { cn } from "@/lib/utils";
import { GlassSurface } from "@/components/glass/glass-surface";

export function SegmentedGlassControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <GlassSurface
      role="tablist"
      strength="regular"
      className={cn("inline-flex items-center gap-0.5 rounded-full p-1", className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-all duration-(--motion-fast) ease-(--motion-spring)",
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </GlassSurface>
  );
}
