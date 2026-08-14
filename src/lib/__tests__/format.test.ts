import { describe, expect, it } from "vitest";
import { formatDuration, initials } from "@/lib/format";

describe("formatDuration", () => {
  it("formats sub-hour durations as m:ss", () => {
    expect(formatDuration(125)).toBe("2:05");
  });

  it("formats hour-plus durations as Nh Nm", () => {
    expect(formatDuration(3725)).toBe("1h 2m");
  });

  it("returns an empty string for missing durations", () => {
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(undefined)).toBe("");
    expect(formatDuration(0)).toBe("");
  });
});

describe("initials", () => {
  it("combines first and last initials", () => {
    expect(initials("Sarah", "Bennett")).toBe("SB");
  });

  it("falls back to a question mark when both names are missing", () => {
    expect(initials(null, null)).toBe("?");
  });

  it("handles a single provided name", () => {
    expect(initials("Sarah", null)).toBe("S");
  });
});
