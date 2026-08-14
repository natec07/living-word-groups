import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("Groups", () => {
  test("a member can join an open group", async ({ page }) => {
    await signIn(page, "member@livingword.church");
    await page.goto("/groups/women-of-the-word");

    const joinButton = page.getByRole("button", { name: "Join group" });
    const leaveButton = page.getByRole("button", { name: "Leave group" });

    if (await joinButton.isVisible().catch(() => false)) {
      await joinButton.click();
      await expect(leaveButton).toBeVisible();
    } else {
      // Already a member from a previous run of this test.
      await expect(leaveButton).toBeVisible();
    }
  });

  test("a member requesting to join an approval-required group is put in a pending state", async ({ page }) => {
    await signIn(page, "member@livingword.church");
    await page.goto("/groups/prayer-team-group");

    const requestButton = page.getByRole("button", { name: /request to join/i });
    if (await requestButton.isVisible().catch(() => false)) {
      await requestButton.click();
      await page.getByRole("button", { name: /send request/i }).click();
      await expect(page.getByRole("button", { name: /request pending/i })).toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: /request pending|leave group/i })).toBeVisible();
    }
  });
});
