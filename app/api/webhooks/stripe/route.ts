import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json(
      { error: 'La configuration Stripe est incomplète.' },
      { status: 503 }
    )
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
  })

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Signature Stripe manquante.' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: `Webhook Error: ${errorMsg}` }, { status: 400 })
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    const amountTotalCents = session.amount_total || 0
    const customerEmail = session.customer_email || session.customer_details?.email

    if (orderId) {
      const supabase = createClient()

      // 1. Update Order status in Supabase
      await supabase
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', orderId)

      revalidatePath('/account')

      // Decrement stock for ordered items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId)

      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single()

          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity)
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.product_id)
          }
        }
      }

      const resendApiKey = process.env.RESEND_API_KEY
      const resendFromEmail = process.env.RESEND_FROM_EMAIL
      if (customerEmail && resendApiKey && resendFromEmail) {
        const resend = new Resend(resendApiKey)
        try {
          await resend.emails.send({
            from: resendFromEmail,
            to: customerEmail,
            subject: 'Confirmation de paiement',
            html: `
              <p>Votre paiement pour la commande ${orderId} a été confirmé.</p>
              <p>Montant payé : ${(amountTotalCents / 100).toFixed(2)} €.</p>
            `,
          })
        } catch (error) {
          console.error('Unable to send order confirmation email:', error)
        }
      } else if (customerEmail) {
        console.error(
          'Order confirmation email not sent: configure RESEND_API_KEY and RESEND_FROM_EMAIL.'
        )
      }
    }
  }

  return NextResponse.json({ received: true })
}
