import { cn } from "@/lib/utils";

type GlassTint = "auto" | "light" | "dark";
type GlassStrength = "regular" | "strong";

const TINT_CLASSES: Record<GlassTint, { regular: string; strong: string; border: string }> = {
  // Follows the active theme: light glass in light mode, dark glass in dark mode.
  auto: { regular: "bg-glass-surface", strong: "bg-glass-surface-strong", border: "border-glass-surface-border" },
  // Explicit picks for surfaces that always want one material regardless of
  // theme — e.g. video controls floating over bright footage want dark glass.
  light: { regular: "bg-glass-light", strong: "bg-glass-light-strong", border: "border-glass-border-light" },
  dark: { regular: "bg-glass-dark", strong: "bg-glass-dark-strong", border: "border-glass-border-dark" },
};

/**
 * The base liquid-glass material: translucent surface, backdrop blur (with a
 * solid-enough fallback where unsupported), a thin border, a soft outer
 * shadow, and a subtle inner top highlight. Compose screen-specific surfaces
 * (cards, headers, sheets, tab bars) from this rather than hand-rolling
 * blur/opacity per component.
 */
export function GlassSurface({
  tint = "auto",
  strength = "regular",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { tint?: GlassTint; strength?: GlassStrength }) {
  const v = TINT_CLASSES[tint];
  return (
    <div
      className={cn(
        strength === "strong" ? v.strong : v.regular,
        "border",
        v.border,
        "[box-shadow:var(--glass-shadow),inset_0_1px_0_0_var(--glass-highlight)]",
        "supports-backdrop-filter:[backdrop-filter:blur(var(--glass-blur))_saturate(var(--glass-saturate))]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
