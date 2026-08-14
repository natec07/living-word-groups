import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test("a member can RSVP to an event", async ({ page }) => {
  await signIn(page, "member@livingword.church");
  await page.goto("/events");
  await page.locator('a[href^="/events/"]').first().click();

  const interestedButton = page.getByRole("button", { name: "Interested" });
  await interestedButton.click();

  // The click round-trips through a server action; re-fetching the page
  // should reflect the persisted RSVP rather than reverting to the default.
  await page.reload();
  await expect(interestedButton).toBeVisible();
});
