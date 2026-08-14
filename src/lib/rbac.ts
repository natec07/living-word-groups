// Central definition of the role/permission system.
//
// Two layers of authorization are used throughout the app:
//  1. Global permission keys (below) for platform-wide / admin-ish
//     capabilities. These are attached to roles (seeded) and can be
//     overridden per-user (UserPermission) so an admin can hand out a
//     custom combination without inventing a new role.
//  2. Resource-scoped checks (e.g. "is this user a leader of THIS group")
//     which live in lib/authz.ts and consult the relevant join table
//     directly instead of a blanket permission flag. A Group Leader's
//     powers are intentionally scoped to their assigned group(s).

export const PERMISSION_KEYS = [
  "users.manage",
  "roles.manage",
  "groups.manage_all",
  "spaces.manage_all",
  "content.moderate",
  "content.feature",
  "media.manage",
  "prayer.view_confidential",
  "prayer.manage_pastoral_notes",
  "prayer.manage_prayer_team",
  "events.manage_all",
  "announcements.publish_churchwide",
  "reports.manage",
  "settings.manage",
  "audit.view",
  "analytics.view",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const ROLE_KEYS = [
  "ADMINISTRATOR",
  "PASTOR_STAFF",
  "MINISTRY_LEADER",
  "GROUP_LEADER",
  "MEMBER",
  "GUEST",
] as const;

export type RoleKeyType = (typeof ROLE_KEYS)[number];

export const ROLE_LABELS: Record<RoleKeyType, string> = {
  ADMINISTRATOR: "Administrator",
  PASTOR_STAFF: "Pastor / Staff",
  MINISTRY_LEADER: "Ministry Leader",
  GROUP_LEADER: "Group Leader",
  MEMBER: "Member",
  GUEST: "Guest",
};

export const ROLE_DEFAULT_PERMISSIONS: Record<RoleKeyType, PermissionKey[]> = {
  ADMINISTRATOR: [...PERMISSION_KEYS],
  PASTOR_STAFF: [
    "groups.manage_all",
    "spaces.manage_all",
    "content.moderate",
    "content.feature",
    "media.manage",
    "prayer.view_confidential",
    "prayer.manage_pastoral_notes",
    "prayer.manage_prayer_team",
    "events.manage_all",
    "announcements.publish_churchwide",
    "reports.manage",
    "analytics.view",
  ],
  MINISTRY_LEADER: ["media.manage", "analytics.view"],
  GROUP_LEADER: [],
  MEMBER: [],
  GUEST: [],
};
