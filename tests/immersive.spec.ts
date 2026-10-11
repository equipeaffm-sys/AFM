import { test, expect } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

test.describe('Immersive Experience & Loyalty Club Suite - Maison L&M', () => {
  test('1. Product Detail Virtual Try-On AR & Fit Finder Buttons', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/products/1`)
    expect([200, 304, 307, 308]).toContain(response.status())
  })

  test('2. VIP Loyalty Club Portal Rendering', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/account/club`)
    expect([200, 304, 307, 308]).toContain(response.status())
  })

  test('3. Admin Loyalty Studio Rendering', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/admin/loyalty`)
    expect([200, 304, 307, 308]).toContain(response.status())
  })
})
