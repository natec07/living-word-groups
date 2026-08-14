import { ConditionalShell } from "@/components/layout/conditional-shell";

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <ConditionalShell>{children}</ConditionalShell>;
}
