import { test, expect } from '@playwright/test';

test.describe('Landing Page E2E Tests', () => {

  // LP-T1-1
  test('LP-T1-1: Scroll interaction reveals content', async ({ page }) => {
    await page.goto('/');
    // Check that some scroll reveal elements exist and eventually have the 'sr-in' class.
    const srElements = page.locator('.sr');
    await expect(srElements.first()).toBeVisible();
    
    // Scroll down to reveal more
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);
    
    // Visible elements or failsafe should apply 'sr-in'
    const srInElements = page.locator('.sr.sr-in');
    await expect(srInElements.first()).toBeVisible();
  });

  // LP-T1-2
  test('LP-T1-2: MCP Console Simulation', async ({ page }) => {
    await page.goto('/');
    // Verify ledger box header contains 'governance-logs.json'
    const header = page.locator('.ledger-box-header');
    await expect(header).toContainText('governance-logs.json');
    await expect(page.locator('.ledger-box-body')).toBeVisible();
  });

  // LP-T1-3
  test('LP-T1-3: Scenario Cycler', async ({ page }) => {
    await page.goto('/');
    // Get the eval row request text
    const evalTextLocator = page.locator('span:has-text("eval: {")');
    await expect(evalTextLocator).toBeVisible();
    const txt = await evalTextLocator.textContent();
    expect(txt).toContain('eval: {');
  });

  // LP-T1-4
  test('LP-T1-4: Newsletter validation', async ({ page }) => {
    await page.goto('/');
    const emailInput = page.locator('.footer-newsletter-input');
    const submitBtn = page.locator('.footer-newsletter-btn');
    
    await emailInput.fill('test@aegis.dev');
    await submitBtn.click();
    
    // Check success state
    await expect(submitBtn).toContainText('Sent!');
    await expect(emailInput).toHaveValue('');
  });

  // LP-T1-5
  test('LP-T1-5: FAQ Accordion', async ({ page }) => {
    await page.goto('/');
    // First item is open by default. Let's click the second item.
    const secondFaq = page.locator('.faq-item').nth(1);
    const secondFaqBtn = secondFaq.locator('.faq-q');
    
    await expect(secondFaq).not.toHaveClass(/is-open/);
    await secondFaqBtn.click();
    await expect(secondFaq).toHaveClass(/is-open/);
  });

  // LP-T2-1
  test('LP-T2-1: Newsletter empty submission triggers error border', async ({ page }) => {
    await page.goto('/');
    const submitBtn = page.locator('.footer-newsletter-btn');
    const wrapper = page.locator('.footer-newsletter-input-wrapper');
    
    // Bypass native validation constraints by removing "required" attribute
    await page.locator('.footer-newsletter-input').evaluate((el) => el.removeAttribute('required'));
    await submitBtn.click();
    // Border style should be set to bad color
    const style = await wrapper.getAttribute('style');
    expect(style).toContain('border-color');
  });

  // LP-T2-2
  test('LP-T2-2: Newsletter invalid email structure fails validation', async ({ page }) => {
    await page.goto('/');
    const emailInput = page.locator('.footer-newsletter-input');
    const submitBtn = page.locator('.footer-newsletter-btn');
    
    // Bypass native validation constraints to allow custom React validation to handle it
    await emailInput.evaluate((el) => el.removeAttribute('required'));
    await emailInput.fill('invalidemail');
    await submitBtn.click();
    
    // Since browser validation or custom onSubmit prevents completion, button text should remain unchanged.
    await page.waitForTimeout(200);
    await expect(submitBtn).not.toContainText('Sent!');
  });

  // LP-T2-3
  test('LP-T2-3: FAQ accordion toggling same item twice collapses it', async ({ page }) => {
    await page.goto('/');
    const firstFaq = page.locator('.faq-item').first();
    const firstFaqBtn = firstFaq.locator('.faq-q');
    
    // Open by default
    await expect(firstFaq).toHaveClass(/is-open/);
    await firstFaqBtn.click();
    await expect(firstFaq).not.toHaveClass(/is-open/);
  });

  // LP-T2-4
  test('LP-T2-4: Mobile menu expansion and collapse via header buttons', async ({ page, viewport }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    const menuToggle = page.locator('#mobileMenuToggle');
    const mobileMenu = page.locator('#mobileMenu');
    
    await expect(mobileMenu).not.toHaveClass(/is-open/);
    await menuToggle.click();
    await expect(mobileMenu).toHaveClass(/is-open/);
    
    // Click it again to close (icon changes but toggle remains the same button)
    await menuToggle.click();
    await expect(mobileMenu).not.toHaveClass(/is-open/);
  });

  // LP-T2-5
  test('LP-T2-5: Mandate search filter with a non-existent search term', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('.ledger-search-input');
    await searchInput.fill('non-existent-mandate-name');
    
    // Should display 'No mandates match'
    const noMatchRow = page.locator('div.ledger-list-item:has-text("No mandates match")');
    await expect(noMatchRow).toBeVisible();
    
    // Active mandates should be hidden
    const mandateItem = page.locator('.ledger-list-item').first();
    // Only the noMatchRow or eval row (if visible) might be present. Let's make sure active mandates are not visible.
    const activeMandates = page.locator('.ledger-list-item:has-text("ACTIVE")');
    await expect(activeMandates).toHaveCount(0);
  });
});
