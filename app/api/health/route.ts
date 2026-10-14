import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: true, env: {
    payments: process.env.PAYMENTS_ENABLED === 'true',
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    supabase: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  }})
}
