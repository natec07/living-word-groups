import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("Posts", () => {
  test("a member can create a post, comment on it, and react to it", async ({ page }) => {
    await signIn(page, "member@livingword.church");
    await page.goto("/community");

    const uniqueText = `E2E test post ${Date.now()}`;
    await page.getByRole("button", { name: /share something with your community/i }).click();
    await page.locator("textarea").last().fill(uniqueText);
    await page.getByRole("button", { name: /^post$/i }).click();

    const postLink = page.locator(`a[href^="/community/posts/"]`, { hasText: uniqueText }).first();
    await expect(postLink).toBeVisible();
    await postLink.click();
    await expect(page).toHaveURL(/\/community\/posts\//);

    await page.getByPlaceholder(/add a comment/i).fill("Great encouragement!");
    await page.getByRole("button", { name: /^comment$/i }).click();
    await expect(page.getByText("Great encouragement!")).toBeVisible();

    await page.getByRole("button", { name: /^amen$/i }).click();
  });
});
