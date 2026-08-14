import { format, formatDistanceToNow, isThisYear, isToday, isTomorrow } from "date-fns";

export function formatEventWhen(date: Date) {
  if (isToday(date)) return `Today · ${format(date, "h:mm a")}`;
  if (isTomorrow(date)) return `Tomorrow · ${format(date, "h:mm a")}`;
  return format(date, isThisYear(date) ? "EEE, MMM d · h:mm a" : "EEE, MMM d, yyyy · h:mm a");
}

export function formatRelative(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDuration(seconds?: number | null) {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function initials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}
