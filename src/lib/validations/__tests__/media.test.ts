import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/validations/media";

describe("slugify", () => {
  it("lowercases and hyphenates a title", () => {
    expect(slugify("Foundations of Faith")).toBe("foundations-of-faith");
  });

  it("strips punctuation", () => {
    expect(slugify("What's Next?")).toBe("what-s-next");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Hello World--  ")).toBe("hello-world");
  });
});
