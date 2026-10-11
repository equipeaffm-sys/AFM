import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3000' });

test.describe('Social Proof, Verified Reviews & Shoppable UGC Feed - Maison L&M', () => {

  test('1. Home Page - Shoppable UGC Instagram Feed ("Porté par vous") Modal', async ({ page }) => {
    await page.goto('/');

    // Scroll to UGC gallery
    const ugcTitle = page.getByText(/L&M Porté par Nos Clients/i);
    await expect(ugcTitle).toBeVisible({ timeout: 10000 });

    // Click "Acheter le Look" badge on first UGC card
    const shopLookBadge = page.getByText(/Acheter le Look/i).first();
    await shopLookBadge.click();

    // Verify pop-up modal is displayed with tagged product details
    const modalAddBtn = page.getByRole('button', { name: /Ajouter Directement/i });
    await expect(modalAddBtn).toBeVisible();
  });

  test('2. Revalidation API & UGC Data Readiness Probe', async ({ request }) => {
    const response = await request.post('/api/revalidate');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.revalidated).toBe(true);
  });

});
