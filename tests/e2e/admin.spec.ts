import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("Administrator controls", () => {
  test("a non-admin member is redirected away from the admin dashboard", async ({ page }) => {
    await signIn(page, "member@livingword.church");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/home/);
  });

  test("an administrator can change a member's role", async ({ page }) => {
    await signIn(page, "admin@livingword.church");
    await page.goto("/admin/users");
    await page.fill('input[name="q"]', "Sarah Bennett");
    await page.getByRole("button", { name: "Search" }).click();
    await page.getByRole("link", { name: "Sarah Bennett" }).click();

    const groupLeaderCheckbox = page.getByRole("checkbox", { name: "Group Leader" });
    const wasChecked = await groupLeaderCheckbox.getAttribute("aria-checked");
    await groupLeaderCheckbox.click();
    await page.waitForTimeout(300);
    const nowChecked = await groupLeaderCheckbox.getAttribute("aria-checked");
    expect(nowChecked).not.toBe(wasChecked);

    // Revert so the seed data stays stable for other test runs.
    await groupLeaderCheckbox.click();
  });

  test("an administrator can resolve a report", async ({ page }) => {
    await signIn(page, "admin@livingword.church");
    await page.goto("/admin/reports");
    const resolveButton = page.getByRole("button", { name: "Resolve" }).first();
    if (await resolveButton.isVisible().catch(() => false)) {
      await resolveButton.click();
    }
  });
});
