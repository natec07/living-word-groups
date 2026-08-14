"use client";

import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateNotificationPreferenceAction } from "@/server/actions/notifications";
import { NOTIFICATION_CATEGORIES, NOTIFICATION_CATEGORY_LABELS } from "@/lib/notifications";
import { NOTIFICATION_FREQUENCY_LABELS } from "@/lib/select-options";

export function NotificationPreferencesForm({ preferences }: { preferences: Record<string, string> }) {
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {NOTIFICATION_CATEGORIES.map((category) => (
        <div key={category} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
          <span className="text-sm">{NOTIFICATION_CATEGORY_LABELS[category]}</span>
          <Select
            items={NOTIFICATION_FREQUENCY_LABELS}
            defaultValue={preferences[category] ?? "IMMEDIATE"}
            onValueChange={(v) => v && startTransition(() => updateNotificationPreferenceAction(category, v))}
          >
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(NOTIFICATION_FREQUENCY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
