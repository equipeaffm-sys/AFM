import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateContractPdf } from '@/lib/contracts'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2022-11-15' }) : null
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  if (!stripe) return NextResponse.json({ received: true })

  const buf = await request.arrayBuffer()
  const raw = Buffer.from(buf)
  const sig = request.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const reservationId = session.metadata?.reservation_request_id
      if (!reservationId) {
        console.warn('No reservation id in session metadata')
        return NextResponse.json({ received: true })
      }

      // mark reservation as paid
      const { error: updateError } = await supabaseAdmin
        .from('reservation_requests')
        .update({ paid: true, stripe_session_id: session.id, paid_at: new Date().toISOString() })
        .eq('id', reservationId)
      if (updateError) console.error('Unable to update reservation paid status:', updateError)

      // fetch reservation to include in contract
      const { data: reservation } = await supabaseAdmin.from('reservation_requests').select('*').eq('id', reservationId).maybeSingle()
      if (!reservation) return NextResponse.json({ received: true })

      // generate contract PDF
      const pdfBuffer = await generateContractPdf(reservation)

      // upload to storage
      const filePath = `contracts/${reservationId}.pdf`
      const uploadRes = await supabaseAdmin.storage.from('documents').upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })
      if (uploadRes.error) {
        console.error('Unable to upload contract PDF:', uploadRes.error)
      }

      // create signed URL
      const createSigned = await supabaseAdmin.storage.from('documents').createSignedUrl(filePath, 60 * 60 * 24 * 7)
      const contractUrl = createSigned.data?.signedUrl

      // send email to customer with contract link
      try {
        const resendApiKey = process.env.RESEND_API_KEY
        const resendFromEmail = process.env.RESEND_FROM_EMAIL
        if (resendApiKey && resendFromEmail) {
          const resend = new Resend(resendApiKey)
          await resend.emails.send({
            from: resendFromEmail,
            to: reservation.email,
            subject: 'Votre bon de réservation',
            text: `Merci. Votre acompte a été reçu. Téléchargez le bon de réservation ici : ${contractUrl}`,
          })
        }
      } catch (e) {
        console.error('Unable to send contract email:', e)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handling error:', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
