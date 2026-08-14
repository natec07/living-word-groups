"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { assignRoleAction } from "@/server/actions/admin-users";
import { ROLE_KEYS, ROLE_LABELS, type RoleKeyType } from "@/lib/rbac";

export function RoleAssignment({ userId, currentRoles }: { userId: string; currentRoles: RoleKeyType[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {ROLE_KEYS.filter((r) => r !== "GUEST").map((role) => (
        <div key={role} className="flex items-center gap-2">
          <Checkbox
            id={role}
            checked={currentRoles.includes(role)}
            onCheckedChange={(checked) =>
              startTransition(async () => {
                await assignRoleAction(userId, role, checked === true);
                router.refresh();
              })
            }
          />
          <Label htmlFor={role} className="font-normal">{ROLE_LABELS[role]}</Label>
        </div>
      ))}
    </div>
  );
}
