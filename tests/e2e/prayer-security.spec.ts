import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("Prayer request privacy", () => {
  test("a member can submit a confidential prayer request", async ({ page }) => {
    await signIn(page, "member@livingword.church");
    await page.goto("/prayer/new");

    await page.fill("#title", `Confidential e2e request ${Date.now()}`);
    await page.getByPlaceholder(/share as much or as little/i).fill("This is a confidential test request.");
    await page.getByText("Completely confidential").click();
    await page.getByRole("button", { name: /submit prayer request/i }).click();

    await expect(page).toHaveURL(/\/prayer\/(?!new)[a-z0-9]{10,}/);
    await expect(page.getByText("Confidential e2e request")).toBeVisible();
  });

  test("an unauthorized member cannot open a confidential prayer request via direct URL", async ({ page, browser }) => {
    // Create a confidential request as one member.
    await signIn(page, "member@livingword.church");
    await page.goto("/prayer/new");
    const title = `Private matter ${Date.now()}`;
    await page.fill("#title", title);
    await page.getByPlaceholder(/share as much or as little/i).fill("Please keep this strictly between staff and me.");
    await page.getByText("Completely confidential").click();
    await page.getByRole("button", { name: /submit prayer request/i }).click();
    await expect(page).toHaveURL(/\/prayer\/(?!new)[a-z0-9]{10,}/);
    const requestUrl = page.url();

    // A different, non-staff member must not be able to open it directly.
    // Next.js may stream a 200 shell before resolving notFound() deep in
    // the tree, so we assert on the rendered outcome (a 404 page with no
    // trace of the confidential content) rather than the raw HTTP status.
    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await signIn(otherPage, "group.leader@livingword.church");
    await otherPage.goto(requestUrl, { waitUntil: "networkidle" });
    await expect(otherPage.getByText(title)).not.toBeVisible();
    await expect(otherPage.getByText(/404|page could not be found/i).first()).toBeVisible({ timeout: 10000 });
    await otherContext.close();
  });
});
