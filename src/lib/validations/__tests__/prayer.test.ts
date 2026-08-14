import { describe, expect, it } from "vitest";
import { createPrayerRequestSchema } from "@/lib/validations/prayer";

const base = {
  title: "Wisdom for a decision",
  details: "Please pray for clarity this week.",
  category: "GUIDANCE" as const,
  urgency: "MEDIUM" as const,
  privacy: "PRAYER_TEAM" as const,
  concealName: false,
};

describe("createPrayerRequestSchema", () => {
  it("accepts a valid prayer request", () => {
    expect(createPrayerRequestSchema.safeParse(base).success).toBe(true);
  });

  it("accepts every documented privacy level, including CONFIDENTIAL", () => {
    const levels = ["PUBLIC", "GROUP", "PRAYER_TEAM", "PASTORAL_STAFF", "ANONYMOUS", "CONFIDENTIAL"];
    for (const privacy of levels) {
      expect(createPrayerRequestSchema.safeParse({ ...base, privacy }).success).toBe(true);
    }
  });

  it("rejects an unrecognized privacy level", () => {
    const result = createPrayerRequestSchema.safeParse({ ...base, privacy: "EVERYONE" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty title or details", () => {
    expect(createPrayerRequestSchema.safeParse({ ...base, title: "" }).success).toBe(false);
    expect(createPrayerRequestSchema.safeParse({ ...base, details: "" }).success).toBe(false);
  });
});
