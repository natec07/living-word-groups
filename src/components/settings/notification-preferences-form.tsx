"use client";

import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateNotificationPreferenceAction } from "@/server/actions/notifications";
import { NOTIFICATION_CATEGORIES, NOTIFICATION_CATEGORY_LABELS } from "@/lib/notifications";

export function NotificationPreferencesForm({ preferences }: { preferences: Record<string, string> }) {
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {NOTIFICATION_CATEGORIES.map((category) => (
        <div key={category} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
          <span className="text-sm">{NOTIFICATION_CATEGORY_LABELS[category]}</span>
          <Select
            defaultValue={preferences[category] ?? "IMMEDIATE"}
            onValueChange={(v) => v && startTransition(() => updateNotificationPreferenceAction(category, v))}
          >
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="IMMEDIATE">Immediate</SelectItem>
              <SelectItem value="DAILY_DIGEST">Daily digest</SelectItem>
              <SelectItem value="WEEKLY_DIGEST">Weekly digest</SelectItem>
              <SelectItem value="OFF">Off</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
