import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dashboard E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Set localStorage flag so the setup wizard is marked as done,
    // allowing the dashboard to render directly.
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('aeg-dash-wizard-done', '1');
      localStorage.setItem('aeg-theme', 'dark'); // start in dark mode
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.goto('/#/app/dashboard');
  });

  // DB-T1-1: Dashboard route navigation
  test('DB-T1-1: Dashboard route navigation updates URL and page view', async ({ page }) => {
    // Assert we start at Dashboard (Overview)
    await expect(page).toHaveURL(/#\/app\/dashboard/);
    await expect(page.locator('.ad-topbar h1')).toContainText('Dashboard');
    await expect(page.locator('.ad-scroll')).toContainText('Welcome back');

    // Define navigation items to click, expected hash, and expected content in PageHeader
    const navItems = [
      { name: 'Governance', hash: '#/app/governance', title: 'Governance' },
      { name: 'Inbox', hash: '#/app/inbox', title: 'Inbox' },
      { name: 'History', hash: '#/app/history', title: 'History' },
      { name: 'Providers', hash: '#/app/providers', title: 'Providers' },
      { name: 'Devices', hash: '#/app/devices', title: 'Devices' },
      { name: 'Settings', hash: '#/app/settings', title: 'Settings' }
    ];

    for (const item of navItems) {
      // Find the sidebar button by text and click it
      const navBtn = page.locator(`.ad-nav-item:has-text("${item.name}")`);
      await navBtn.click();
      
      // Verify URL hash updates correctly
      await expect(page).toHaveURL(new RegExp(item.hash.replace('/', '\\/')));

      // Verify correct page title is shown
      await expect(page.locator('.ad-topbar h1')).toContainText(item.title);
    }
  });

  // DB-T1-2: Mobile viewport rendering
  test('DB-T1-2: Mobile viewport rendering adapts layout and prevents horizontal overflow', async ({ page }) => {
    // Set viewport to 375px width (standard mobile)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500); // Let CSS calculations and reflow finish

    const sidebar = page.locator('.ad-side');
    await expect(sidebar).toBeVisible();

    // Check sidebar width is collapsed (68px width)
    const box = await sidebar.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeCloseTo(68, 0); // Assert it collapses to ~68px width
    }

    // Check that brand text is hidden on mobile
    const brandName = page.locator('.ad-brand-name');
    await expect(brandName).not.toBeVisible();

    // Check that there is no horizontal layout overflow on the page body
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  // DB-T1-3: Accessibility check - Landing Page
  test('DB-T1-3: Accessibility check on Landing Page has no critical violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Run accessibility scan
    const results = await new AxeBuilder({ page }).analyze();
    
    // Filter for critical violations
    const criticalViolations = results.violations.filter(v => v.impact === 'critical');
    
    if (criticalViolations.length > 0) {
      console.error('Critical accessibility violations on Landing Page:', JSON.stringify(criticalViolations, null, 2));
    }
    
    expect(criticalViolations).toEqual([]);
  });

  // DB-T1-4: Accessibility check - Dashboard Page
  test('DB-T1-4: Accessibility check on Dashboard Page has no critical violations', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    
    // Run accessibility scan on the dashboard view
    const results = await new AxeBuilder({ page }).analyze();
    
    // Filter for critical violations
    const criticalViolations = results.violations.filter(v => v.impact === 'critical');
    
    if (criticalViolations.length > 0) {
      console.error('Critical accessibility violations on Dashboard Page:', JSON.stringify(criticalViolations, null, 2));
    }
    
    expect(criticalViolations).toEqual([]);
  });

  // DB-T1-5: Sidebar theme toggle adapts the theme properly
  test('DB-T1-5: Sidebar theme toggle updates theme attribute', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Click the theme toggle button in the sidebar
    const themeBtn = page.locator('.ad-theme-toggle');
    await themeBtn.click();
    await page.waitForTimeout(200);

    // Verify it changed to light mode (attribute is removed)
    await expect(html).not.toHaveAttribute('data-theme', 'dark');

    // Toggle back
    await themeBtn.click();
    await page.waitForTimeout(200);
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });
});
