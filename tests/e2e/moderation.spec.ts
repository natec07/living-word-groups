import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test("a member can report a post", async ({ page }) => {
  await signIn(page, "member@livingword.church");
  await page.goto("/community");

  await page.getByRole("button", { name: "Post options" }).first().click();
  await page.getByText("Report").click();

  await expect(page.getByText(/thanks.*review this/i)).toBeVisible();
});
