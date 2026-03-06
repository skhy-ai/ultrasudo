const { test, expect } = require('@playwright/test');

test('should redirect to login if unauthenticated', async ({ page }) => {
    await page.goto('/desktop/desktop.html');
    await expect(page).toHaveURL(/.*login.html/);
});

test('login page contains necessary fields', async ({ page }) => {
    await page.goto('/auth/login.html');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#login-btn')).toBeVisible();
});
