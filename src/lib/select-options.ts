/**
 * Human-readable labels for the enum values used in <Select> dropdowns.
 *
 * These exist because Base UI's <Select.Value> renders the raw selected
 * *value* unless the <Select.Root> is given an `items` map — so a member who
 * picked "Young adult" would see the trigger flip to `YOUNG_ADULT`, and an
 * admin would see `APPROVAL_REQUIRED` / `MEMBERS_ONLY` / `DAILY_DIGEST`.
 * Passing one of these maps as `items` fixes the display, and rendering the
 * <SelectItem> list from the same map keeps the options and the trigger label
 * from ever drifting apart.
 */

export const AGE_RANGE_LABELS: Record<string, string> = {
  YOUTH: "Youth",
  YOUNG_ADULT: "Young adult",
  ADULT: "Adult",
  SENIOR: "Senior",
};

export const NOTIFICATION_FREQUENCY_LABELS: Record<string, string> = {
  IMMEDIATE: "Immediate",
  DAILY_DIGEST: "Daily digest",
  WEEKLY_DIGEST: "Weekly digest",
  OFF: "Off",
};

export const ANNOUNCEMENT_AUDIENCE_LABELS: Record<string, string> = {
  EVERYONE: "Everyone",
  GROUP: "Specific group",
  NEW_MEMBERS: "New members",
};

export const ANNOUNCEMENT_PRIORITY_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  IMPORTANT: "Important",
  URGENT: "Urgent",
};

export const EVENT_VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  MEMBERS_ONLY: "Members only",
};

export const SPACE_TYPE_LABELS: Record<string, string> = {
  CHURCH_WIDE: "Church-wide",
  MINISTRY: "Ministry",
  GROUP_HUB: "Group hub",
  EVENT_TEMP: "Temporary (event/conference)",
};

export const SPACE_VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  MEMBERS_ONLY: "Members only",
  PRIVATE: "Private",
  INVITE_ONLY: "Invite only",
  HIDDEN: "Hidden",
};

export const GROUP_PRIVACY_LABELS: Record<string, string> = {
  OPEN: "Open — anyone can join",
  APPROVAL_REQUIRED: "Approval required",
  INVITE_ONLY: "Invite only",
  HIDDEN: "Hidden (leadership)",
};
