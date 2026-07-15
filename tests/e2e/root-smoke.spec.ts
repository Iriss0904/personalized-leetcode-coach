import { expect, test } from "@playwright/test";

test("fresh user completes the real local Coach loop", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await expect(page).toHaveURL(/\/(onboarding|today)$/);

  if (page.url().endsWith("/onboarding")) {
    await page.getByRole("button", { name: "Skip onboarding" }).click();
    await expect(page).toHaveURL(/\/today$/);
  }

  const createPlan = page.getByRole("button", { name: "Create local plan" });
  if (await createPlan.isVisible()) {
    await createPlan.click();
    await expect(page.getByText("Today dose")).toBeVisible();
  }

  await page.goto("/workbench?problem=two-sum");
  const main = page.getByRole("main");
  await expect(main.getByText("Local Piston is healthy")).toBeVisible();
  const editor = page.locator('[data-testid="code-draft-editor"] .monaco-editor');
  await editor.waitFor({ state: "visible" });
  await editor.scrollIntoViewIfNeeded();
  await editor.click({ position: { x: 240, y: 240 } });
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("class Solution:");
  await page.keyboard.press("Enter");
  await page.keyboard.insertText("def twoSum(self, nums, target): return [1, 2]");

  const runCode = page.getByRole("button", { name: "Run Code" });
  await expect(runCode).toBeEnabled();
  await runCode.click();
  await expect(main.getByText("Real Python execution finished and was saved locally.")).toBeVisible();
  await expect(main.getByText(/1\/1 selected visible tests passed locally/i)).toBeVisible();

  const review = page.getByRole("button", { name: "Review My Code" });
  await expect(review).toBeEnabled();
  await review.click();
  await expect(main.getByText(/Review used real Piston evidence/)).toBeVisible();
  await page.getByRole("button", { name: "struggled" }).click();
  await expect(main.getByText(/Self-rating saved/)).toBeVisible();

  await page.getByPlaceholder(/Ask Coach/).fill("Run the current code");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(main.getByText(/Built-in local Coach completed the turn/)).toBeVisible();
  await expect(main.getByText("• run_current_code", { exact: true })).toBeVisible();

  await page.goto("/history/problems");
  await expect(page.getByText("Two Sum").first()).toBeVisible();
  await page.goto("/history/chats");
  await expect(page.getByText("Two Sum").first()).toBeVisible();
  await page.goto("/today");
  await expect(page.getByText("Review focus")).toBeVisible();
});
