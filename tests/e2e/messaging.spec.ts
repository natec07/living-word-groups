import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test("a member can send a direct message to a staff member", async ({ page }) => {
  await signIn(page, "member@livingword.church");
  await page.goto("/messages/new");

  await page.getByPlaceholder(/search for a member/i).fill("Whitfield");
  await page.getByText("Marcus Whitfield").click();

  const uniqueMessage = `E2E message ${Date.now()}`;
  await page.getByPlaceholder(/write your message/i).fill(uniqueMessage);
  await page.getByRole("button", { name: /^send$/i }).click();

  await expect(page).toHaveURL(/\/messages\//);
  await expect(page.getByText(uniqueMessage)).toBeVisible();
});
