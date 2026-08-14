import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";

type LinkProps = React.ComponentProps<typeof Link>;

type ButtonLinkProps = LinkProps &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    children: React.ReactNode;
  };

// Base UI's Button uses a `render` prop instead of Radix's `asChild`.
// This wrapper keeps call sites terse: <ButtonLink href="/x">Text</ButtonLink>.
export function ButtonLink({ href, variant, size, className, children, ...linkProps }: ButtonLinkProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      nativeButton={false}
      render={<Link href={href} {...linkProps} />}
    >
      {children}
    </Button>
  );
}
