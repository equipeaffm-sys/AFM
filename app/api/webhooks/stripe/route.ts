import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeKey || !webhookSecret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'La configuration Stripe ou Supabase serveur est incomplète.' },
      { status: 503 }
    )
  }

  const stripe = new Stripe(stripeKey)
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Signature Stripe manquante.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Signature invalide.'
    return NextResponse.json({ error: `Webhook Stripe invalide : ${errorMessage}` }, { status: 400 })
  }

  const isPaidEvent =
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  const isFailedEvent =
    event.type === 'checkout.session.expired' ||
    event.type === 'checkout.session.async_payment_failed'

  if (!isPaidEvent && !isFailedEvent) {
    return NextResponse.json({ received: true })
  }

  const eventSession = event.data.object as Stripe.Checkout.Session
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(eventSession.id)
  } catch (error: unknown) {
    console.error('Unable to retrieve the current Stripe Checkout session:', error)
    return NextResponse.json({ error: 'Impossible de vérifier la session Stripe.' }, { status: 500 })
  }
  const orderId = session.metadata?.order_id
  if (!orderId) {
    console.error('Stripe Checkout event is missing its order_id metadata.', event.id)
    return NextResponse.json({ error: 'La commande Stripe est introuvable.' }, { status: 400 })
  }

  const { supabaseAdmin } = await import('@/lib/supabase/admin')
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, status, total_cents, stripe_session_id')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError) {
    console.error('Unable to load the order for Stripe event:', orderError)
    return NextResponse.json({ error: 'Impossible de charger la commande.' }, { status: 500 })
  }
  if (!order || order.stripe_session_id !== session.id) {
    console.error('Stripe session does not match its stored order.', {
      eventId: event.id,
      orderId,
      sessionId: session.id,
    })
    return NextResponse.json({ error: 'La session Stripe ne correspond pas à la commande.' }, { status: 500 })
  }

  if (isFailedEvent) {
    const { error: releaseError } = await supabaseAdmin.rpc(
      'release_pending_checkout_order',
      { p_order_id: orderId }
    )
    if (releaseError) {
      console.error('Unable to release stock for an unsuccessful Stripe session:', releaseError)
      return NextResponse.json({ error: 'Impossible de libérer le stock de la commande.' }, { status: 500 })
    }
    revalidatePath('/account')
    return NextResponse.json({ received: true })
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true })
  }
  if (
    session.currency !== 'eur' ||
    session.amount_subtotal === null ||
    session.amount_subtotal !== order.total_cents ||
    session.amount_total === null ||
    session.amount_total < session.amount_subtotal
  ) {
    console.error('Stripe totals do not match the stored order.', {
      sessionId: session.id,
      orderId,
      orderSubtotalCents: order.total_cents,
      stripeSubtotalCents: session.amount_subtotal,
      stripeTotalCents: session.amount_total,
      currency: session.currency,
    })
    return NextResponse.json({ error: 'Le montant Stripe ne correspond pas à la commande.' }, { status: 500 })
  }

  const shipping = session.collected_information?.shipping_details
  if (!shipping?.name || !shipping.address) {
    console.error('Paid Stripe Checkout session has no shipping address.', session.id)
    return NextResponse.json({ error: 'L’adresse de livraison est manquante.' }, { status: 500 })
  }
  const shippingAddress = {
    fullName: shipping.name,
    street: [shipping.address.line1, shipping.address.line2].filter(Boolean).join(', '),
    city: shipping.address.city || '',
    state: shipping.address.state || '',
    postal_code: shipping.address.postal_code || '',
    country: shipping.address.country || '',
  }

  const { data: updatedOrder, error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'paid',
      shipping_address: shippingAddress,
      total_cents: session.amount_total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('stripe_session_id', session.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (updateError) {
    console.error('Unable to mark the paid order:', updateError)
    return NextResponse.json({ error: 'Impossible de confirmer la commande.' }, { status: 500 })
  }

  revalidatePath('/account')
  if (!updatedOrder) {
    return NextResponse.json({ received: true })
  }

  const amountTotalCents = session.amount_total
  const customerEmail = session.customer_email || session.customer_details?.email
  const resendApiKey = process.env.RESEND_API_KEY
  const resendFromEmail = process.env.RESEND_FROM_EMAIL

  if (customerEmail && resendApiKey && resendFromEmail) {
    const resend = new Resend(resendApiKey)
    try {
      const { error: emailError } = await resend.emails.send({
        from: resendFromEmail,
        to: customerEmail,
        subject: 'Confirmation de paiement',
        text: `Votre paiement pour la commande ${orderId} a été confirmé. Montant payé : ${(amountTotalCents / 100).toFixed(2)} €.`,
        html: `
          <p>Votre paiement pour la commande <strong>${escapeHtml(orderId)}</strong> a été confirmé.</p>
          <p>Montant payé : <strong>${(amountTotalCents / 100).toFixed(2)} €</strong>.</p>
        `,
      })
      if (emailError) {
        console.error('Unable to send order confirmation email:', emailError.message)
      }
    } catch (error) {
      console.error('Unable to send order confirmation email:', error)
    }
  } else if (customerEmail) {
    console.error(
      'Order confirmation email not sent: configure RESEND_API_KEY and RESEND_FROM_EMAIL.'
    )
  }

  return NextResponse.json({ received: true })
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}
