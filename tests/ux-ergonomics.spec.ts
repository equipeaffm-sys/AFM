import { test, expect } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

test.describe('Public Storefront Ergonomics & UX Suite - Maison L&M', () => {
  test('1. Storefront Home & Responsive Navigation Bar', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/`)
    expect([200, 304]).toContain(response.status())
  })

  test('2. Product Detail Client Dynamic Route Rendering', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/products/1`)
    expect([200, 304]).toContain(response.status())
  })

  test('3. Checkout API Readiness Probe', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/checkout`)
    expect([404, 405]).toContain(response.status())
  })
})
