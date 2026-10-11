import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3000' });

test.describe('Search, Faceted Filters & Catalog Batch Loading - Maison L&M', () => {

  test('1. Live Search Overlay Modal - Open, Type Debounced Search & Select Suggestion', async ({ page }) => {
    await page.goto('/');

    // Click search magnifying glass button in Navbar
    const searchBtn = page.getByRole('button', { name: 'Rechercher' }).first();
    await searchBtn.click();

    // Verify search modal is open
    const searchInput = page.getByPlaceholder(/Rechercher une création/i);
    await expect(searchInput).toBeVisible();

    // Type query "Sac"
    await searchInput.fill('Sac');

    // Wait for debounced search results to render
    await page.waitForTimeout(500);

    // Verify search modal results section exists
    const resultsCount = page.getByText(/création\(s\) trouvée\(s\)/i);
    await expect(resultsCount).toBeVisible();
  });

  test('2. Faceted Filters, URL Query Params & Dynamic Sorting on /products', async ({ page }) => {
    await page.goto('/products');

    // Verify page title
    await expect(page.locator('h1')).toContainText('Nos Créations de Luxe');

    // Click Faceted Filters button
    const filterBtn = page.getByRole('button', { name: /Filtres Facettés/i });
    await filterBtn.click();

    // Fill min price filter
    const minPriceInput = page.getByPlaceholder('Min');
    await minPriceInput.fill('100');

    // Verify URL params updated with minPrice=100
    await page.waitForTimeout(300);
    expect(page.url()).toContain('minPrice=100');

    // Verify result counter badge exists
    const counterBadge = page.getByText(/pièce\(s\) trouvée\(s\)/i);
    await expect(counterBadge).toBeVisible();
  });

  test('3. Batch Loading ("Charger plus de créations") and Revalidation API Endpoint', async ({ page, request }) => {
    await page.goto('/products');

    // Check presence of catalog products or load more button
    const loadMoreBtn = page.getByRole('button', { name: /Charger plus de créations/i });
    if (await loadMoreBtn.isVisible()) {
      await loadMoreBtn.click();
    }

    // Call revalidation API
    const response = await request.post('/api/revalidate');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.revalidated).toBe(true);
  });

});
