import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-4 text-[13px]",
  md: "h-11 gap-2 px-5 text-[15px]",
  lg: "h-13 gap-2 px-6 text-base",
};

const PRESS_BASE =
  "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium outline-none transition-[transform,background-color,box-shadow,opacity] duration-(--motion-fast) ease-(--motion-spring) active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0";

type BaseProps = ButtonPrimitive.Props & {
  size?: ButtonSize;
  loading?: boolean;
};

/**
 * The app's dominant call-to-action surface — reserve for the one primary
 * action per screen (spec: "Do not make every button orange"). Capsule
 * shape, glossy upper-edge highlight, soft shadow for a touch of depth.
 */
export function PrimaryButton({ size = "md", loading, disabled, className, children, ...props }: BaseProps) {
  return (
    <ButtonPrimitive
      data-slot="primary-button"
      disabled={disabled || loading}
      className={cn(
        PRESS_BASE,
        SIZE_CLASSES[size],
        "rounded-full bg-primary text-primary-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.35)_inset,0_8px_20px_-8px_var(--brand-primary)] hover:brightness-105",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </ButtonPrimitive>
  );
}

/**
 * Secondary action surface: a translucent glass capsule instead of a solid
 * fill, so it reads as "present but not the main action."
 */
export function GlassButton({ size = "md", loading, disabled, className, children, ...props }: BaseProps) {
  return (
    <ButtonPrimitive
      data-slot="glass-button"
      disabled={disabled || loading}
      className={cn(
        PRESS_BASE,
        SIZE_CLASSES[size],
        "rounded-full border border-glass-surface-border bg-glass-surface text-foreground",
        "[box-shadow:var(--glass-shadow),inset_0_1px_0_0_var(--glass-highlight)]",
        "supports-backdrop-filter:[backdrop-filter:blur(var(--glass-blur))_saturate(var(--glass-saturate))]",
        "hover:bg-glass-surface-strong",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </ButtonPrimitive>
  );
}

/**
 * The lightest-weight action: no surface at all, just tinted text. For
 * things like "Cancel," "See all," inline row actions.
 */
export function PlainButton({ size = "md", loading, disabled, className, children, ...props }: BaseProps) {
  return (
    <ButtonPrimitive
      data-slot="plain-button"
      disabled={disabled || loading}
      className={cn(
        PRESS_BASE,
        SIZE_CLASSES[size],
        "rounded-full px-3 text-primary hover:bg-primary/8",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </ButtonPrimitive>
  );
}
