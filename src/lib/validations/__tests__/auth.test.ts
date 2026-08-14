import { describe, expect, it } from "vitest";
import { registerSchema, signInSchema } from "@/lib/validations/auth";

describe("registerSchema", () => {
  const valid = {
    firstName: "Sarah",
    lastName: "Bennett",
    email: "sarah@example.com",
    password: "Password1",
    agreeToGuidelines: true,
  };

  it("accepts a fully valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password without an uppercase letter", () => {
    const result = registerSchema.safeParse({ ...valid, password: "password1" });
    expect(result.success).toBe(false);
  });

  it("rejects a password without a number", () => {
    const result = registerSchema.safeParse({ ...valid, password: "Password" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "Pass1" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email address", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("requires the community guidelines checkbox to be checked", () => {
    const result = registerSchema.safeParse({ ...valid, agreeToGuidelines: false });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("requires both an email and a non-empty password", () => {
    expect(signInSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });
});
