import { describe, expect, it } from "vitest";
import { isFieldVisible } from "@/lib/profile-visibility";

describe("isFieldVisible", () => {
  it("is always visible to the profile owner, even if marked private", () => {
    expect(isFieldVisible({ bio: "PRIVATE" }, "bio", true)).toBe(true);
  });

  it("hides a field explicitly marked PRIVATE from other members", () => {
    expect(isFieldVisible({ bio: "PRIVATE" }, "bio", false)).toBe(false);
  });

  it("defaults to visible when no preference has been set", () => {
    expect(isFieldVisible({}, "bio", false)).toBe(true);
    expect(isFieldVisible(null, "bio", false)).toBe(true);
  });

  it("treats PUBLIC and MEMBERS as visible to other members", () => {
    expect(isFieldVisible({ bio: "PUBLIC" }, "bio", false)).toBe(true);
    expect(isFieldVisible({ bio: "MEMBERS" }, "bio", false)).toBe(true);
  });
});
