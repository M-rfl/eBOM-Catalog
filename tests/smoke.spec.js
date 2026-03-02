// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const FIXTURES = path.join(__dirname, 'fixtures');

// ─── Test 1: App loads without console errors ───────────────────────
test('app loads without console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await page.waitForSelector('header');

  // Header and nav should be visible
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('#tabNav')).toBeVisible();

  // No JS errors (filter out CDN/network errors that aren't our fault)
  const appErrors = errors.filter(
    (e) => !e.includes('model-viewer') && !e.includes('cdn') && !e.includes('ERR_NAME')
  );
  expect(appErrors).toHaveLength(0);
});

// ─── Test 2: Tab switching ──────────────────────────────────────────
test('all 5 tabs activate and deactivate correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#tabNav');

  const tabs = page.locator('#tabButtons .tab');
  await expect(tabs).toHaveCount(5);

  const tabIds = ['montagem', 'pesquisaMaterial', 'chat', 'checklistDigital', 'tools'];

  for (let i = 0; i < tabIds.length; i++) {
    await tabs.nth(i).click();
    // The clicked tab should be active
    await expect(tabs.nth(i)).toHaveClass(/active/);
    // The corresponding content should be visible
    await expect(page.locator(`#${tabIds[i]}`)).toHaveClass(/active/);
    // Other tabs should NOT be active
    for (let j = 0; j < tabIds.length; j++) {
      if (j !== i) {
        await expect(tabs.nth(j)).not.toHaveClass(/active/);
      }
    }
  }
});

// ─── Test 3: Hierarchy JSON import ──────────────────────────────────
test('hierarchy JSON import renders tree', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#tabNav');

  // Dismiss any alert from loading
  page.on('dialog', (dialog) => dialog.accept());

  // Upload hierarchy fixture
  const fileInput = page.locator('#fileInput');
  await fileInput.setInputFiles(path.join(FIXTURES, 'test-hierarchy.json'));

  // Click the Import button in the hierarchy tab
  await page.locator('#montagem .tab-import-bar .btn-primary').click();

  // Wait for tree items to appear
  await expect(page.locator('.tree-item').first()).toBeVisible({ timeout: 5000 });

  // Should have 3 nodes (parent + child + grandchild)
  const treeItems = page.locator('.tree-item');
  await expect(treeItems).toHaveCount(3);
});

// ─── Test 4: Tree node click shows details ──────────────────────────
test('clicking tree node shows details and applies selected class', async ({ page }) => {
  await page.goto('/');
  page.on('dialog', (dialog) => dialog.accept());

  // Import hierarchy
  await page.locator('#fileInput').setInputFiles(path.join(FIXTURES, 'test-hierarchy.json'));
  await page.locator('#montagem .tab-import-bar .btn-primary').click();
  await expect(page.locator('.tree-item').first()).toBeVisible({ timeout: 5000 });

  // Click first node's name
  await page.locator('.item-originalname').first().click();

  // Should have .selected class
  await expect(page.locator('.tree-item').first()).toHaveClass(/selected/);

  // Details table should appear in #tableContainer
  await expect(page.locator('#tableContainer table')).toBeVisible();
});

// ─── Test 5: Material JSON import + filter ──────────────────────────
test('material JSON import and filter shows results', async ({ page }) => {
  await page.goto('/');
  page.on('dialog', (dialog) => dialog.accept());

  // Switch to Material Search tab
  await page.locator('#tabButtons .tab').nth(1).click();

  // Import material fixture
  await page.locator('#fileInputCadastro').setInputFiles(path.join(FIXTURES, 'test-materials.json'));
  await page.locator('#pesquisaMaterial .tab-import-bar .btn-primary').click();

  // Wait for search input to become enabled
  await expect(page.locator('#searchInput')).toBeEnabled({ timeout: 5000 });

  // Type a search term and click filter
  await page.locator('#searchInput').fill('Parafuso');
  await page.locator('#filterButton').click();

  // Result count should be visible and show results
  await expect(page.locator('#resultCount')).toBeVisible();
  const countText = await page.locator('#resultCount').textContent();
  expect(countText).toContain('1');
});

// ─── Test 6: Sidebar toggle ────────────────────────────────────────
test('sidebar toggle hides and shows tab navigation', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#tabNav');

  const navToggle = page.locator('#navToggleBtn');
  const tabNav = page.locator('#tabNav');

  // Tab nav should be visible initially
  await expect(tabNav).toBeVisible();

  // Toggle off
  await navToggle.click();
  await expect(tabNav).toHaveClass(/hidden/);

  // Toggle back on
  await navToggle.click();
  await expect(tabNav).not.toHaveClass(/hidden/);
});

// ─── Test 7: Language toggle ────────────────────────────────────────
test('language toggle switches between EN and PT', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#langToggleBtn');

  const langBtn = page.locator('#langToggleBtn');

  // Initial state should be PT (switch to EN)
  const initialText = await langBtn.textContent();
  expect(['PT', 'EN']).toContain(initialText.trim());

  // Click to toggle
  await langBtn.click();

  // Text should change
  const newText = await langBtn.textContent();
  expect(newText.trim()).not.toBe(initialText.trim());
});

// ─── Test 8: Import bar collapse ────────────────────────────────────
test('import bar collapses and expands', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.tab-import-bar');

  const toggleBtn = page.locator('#montagem .toggle-import-bar');
  const importBar = page.locator('#montagem .tab-import-bar');

  // Click to collapse
  await toggleBtn.click();
  await expect(importBar).toHaveClass(/collapsed/);

  // Click to expand
  await toggleBtn.click();
  await expect(importBar).not.toHaveClass(/collapsed/);
});

// ─── Test 9: Tools tab shows 3 tool cards ───────────────────────────
test('tools tab shows 3 tool cards', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#tabNav');

  // Switch to Tools tab
  await page.locator('#tab-tools').click();

  // Wait for tools tab to be active
  await expect(page.locator('#tools')).toHaveClass(/active/);

  // Should have 3 tool cards
  const toolCards = page.locator('.tool-card');
  await expect(toolCards).toHaveCount(3);
});

// ─── Test 10: No legacy orange colors in header ─────────────────────
test('no legacy orange colors remain in header', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('header');

  // Check header background color isn't orange
  const headerBg = await page.locator('header').evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });

  // Orange #FF7C3C = rgb(255, 124, 60) — should NOT be present
  expect(headerBg).not.toContain('255, 124, 60');

  // Also check that header border isn't orange
  const headerBorder = await page.locator('header').evaluate((el) => {
    return window.getComputedStyle(el).borderBottomColor;
  });
  expect(headerBorder).not.toContain('255, 124, 60');
});
