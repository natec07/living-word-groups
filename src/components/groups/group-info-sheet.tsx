"use client";

import { Info } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function GroupInfoSheet({ groupName, children }: { groupName: string; children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger
        aria-label="Group info"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
      >
        <Info className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{groupName}</SheetTitle>
        </SheetHeader>
        <div className="max-h-[75vh] space-y-6 overflow-y-auto px-4 pb-8">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
