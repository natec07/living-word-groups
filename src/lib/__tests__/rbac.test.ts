import { describe, expect, it } from "vitest";
import { PERMISSION_KEYS, ROLE_DEFAULT_PERMISSIONS, ROLE_KEYS } from "@/lib/rbac";

describe("rbac defaults", () => {
  it("gives the Administrator role every permission", () => {
    expect(ROLE_DEFAULT_PERMISSIONS.ADMINISTRATOR).toEqual(expect.arrayContaining([...PERMISSION_KEYS]));
    expect(ROLE_DEFAULT_PERMISSIONS.ADMINISTRATOR).toHaveLength(PERMISSION_KEYS.length);
  });

  it("never grants Guest or Member any platform-wide permission", () => {
    expect(ROLE_DEFAULT_PERMISSIONS.GUEST).toEqual([]);
    expect(ROLE_DEFAULT_PERMISSIONS.MEMBER).toEqual([]);
  });

  it("does not grant Pastor/Staff the admin-only settings or roles permissions", () => {
    expect(ROLE_DEFAULT_PERMISSIONS.PASTOR_STAFF).not.toContain("settings.manage");
    expect(ROLE_DEFAULT_PERMISSIONS.PASTOR_STAFF).not.toContain("roles.manage");
    expect(ROLE_DEFAULT_PERMISSIONS.PASTOR_STAFF).not.toContain("audit.view");
  });

  it("grants Pastor/Staff confidential prayer visibility", () => {
    expect(ROLE_DEFAULT_PERMISSIONS.PASTOR_STAFF).toContain("prayer.view_confidential");
  });

  it("has a default permission entry for every role", () => {
    for (const role of ROLE_KEYS) {
      expect(ROLE_DEFAULT_PERMISSIONS[role]).toBeDefined();
    }
  });
});
