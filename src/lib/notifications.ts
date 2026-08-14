export const NOTIFICATION_CATEGORIES = [
  "COMMENT",
  "REPLY",
  "MENTION",
  "REACTION",
  "GROUP_ANNOUNCEMENT",
  "EVENT_REMINDER",
  "MEMBERSHIP_APPROVAL",
  "NEW_MESSAGE",
  "STAFF_ANNOUNCEMENT",
] as const;

export const NOTIFICATION_CATEGORY_LABELS: Record<(typeof NOTIFICATION_CATEGORIES)[number], string> = {
  COMMENT: "Comments on your posts",
  REPLY: "Replies to your comments",
  MENTION: "Mentions",
  REACTION: "Reactions",
  GROUP_ANNOUNCEMENT: "Group announcements",
  EVENT_REMINDER: "Event reminders",
  MEMBERSHIP_APPROVAL: "Membership approvals",
  NEW_MESSAGE: "New messages",
  STAFF_ANNOUNCEMENT: "Church-wide announcements",
};
