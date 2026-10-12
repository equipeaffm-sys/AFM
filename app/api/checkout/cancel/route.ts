import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Session utilisateur requise.' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'La requête est invalide.' }, { status: 400 })
  }
  const orderId =
    typeof payload === 'object' && payload !== null && 'orderId' in payload
      ? payload.orderId
      : null
  if (typeof orderId !== 'string' || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: 'Identifiant de commande invalide.' }, { status: 400 })
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'La configuration du paiement est incomplète.' }, { status: 503 })
  }

  try {
    const [{ supabaseAdmin }] = await Promise.all([import('@/lib/supabase/admin')])
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, stripe_session_id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (orderError) {
      console.error('Unable to load the order for checkout cancellation:', orderError)
      return NextResponse.json({ error: 'Impossible de vérifier la commande.' }, { status: 500 })
    }
    if (!order || order.status !== 'pending' || !order.stripe_session_id) {
      return NextResponse.json({ released: false })
    }

    const stripe = new Stripe(stripeKey)
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
    if (session.status === 'open') {
      await stripe.checkout.sessions.expire(session.id)
    } else if (session.status === 'complete') {
      return NextResponse.json({ released: false })
    }

    const { data: released, error: releaseError } = await supabaseAdmin.rpc(
      'release_pending_checkout_order',
      { p_order_id: order.id }
    )
    if (releaseError) {
      console.error('Unable to release stock after checkout cancellation:', releaseError)
      return NextResponse.json({ error: 'Impossible de libérer le stock réservé.' }, { status: 500 })
    }
    return NextResponse.json({ released: released === true })
  } catch (error: unknown) {
    console.error('Unable to cancel Stripe Checkout:', error)
    return NextResponse.json(
      { error: 'Impossible de terminer l’annulation du paiement.' },
      { status: 502 }
    )
  }
}
