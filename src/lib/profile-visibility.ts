type VisibilityMap = Record<string, "PUBLIC" | "MEMBERS" | "PRIVATE">;

// Every viewer on this platform is at minimum a signed-in member, so
// PUBLIC and MEMBERS are equivalent here — PRIVATE is the only setting
// that actually hides a field from other members.
export function isFieldVisible(visibility: unknown, field: string, isOwner: boolean) {
  if (isOwner) return true;
  const map = (visibility ?? {}) as VisibilityMap;
  return map[field] !== "PRIVATE";
}
