import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Resend } from 'resend';

export const runtime = 'nodejs'

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2022-11-15' }) : null;

const jsonHeaders = { 'Cache-Control': 'no-store' }

export async function POST(request: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Le service de réservation n’est pas configuré.' }, { status: 503, headers: jsonHeaders })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'La requête doit contenir un JSON valide.' }, { status: 400, headers: jsonHeaders })
  }

  const body = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>

  const fullName = typeof body.full_name === 'string' ? body.full_name.trim().slice(0, 120) : null
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : null
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : null
  const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : null
  const housingType = typeof body.housing_type === 'string' ? body.housing_type.trim().slice(0, 120) : null
  const otherPets = typeof body.other_pets === 'string' ? body.other_pets.trim().slice(0, 500) : null
  const hasGarden = typeof body.has_garden === 'boolean' ? body.has_garden : (body.has_garden === 'true' ? true : body.has_garden === 'false' ? false : null)
  const hasChildren = typeof body.has_children === 'boolean' ? body.has_children : (body.has_children === 'true' ? true : body.has_children === 'false' ? false : null)

  const dogId = typeof body.dog_id === 'string' ? body.dog_id.trim() : null
  const dogName = typeof body.dog_name === 'string' ? body.dog_name.trim().slice(0, 120) : null

  if (!fullName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Merci d’indiquer votre nom complet et une adresse e-mail valide.' }, { status: 400, headers: jsonHeaders })
  }

  try {
    const insert = await supabaseAdmin.from('reservation_requests').insert({
      dog_id: dogId,
      dog_name: dogName,
      full_name: fullName,
      email,
      phone,
      message,
      housing_type: housingType,
      has_garden: hasGarden,
      has_children: hasChildren,
      other_pets: otherPets,
    }).select().single()

    if (insert.error) throw insert.error
    const reservation = insert.data

    // send notification email (same as before)
    const resendApiKey = process.env.RESEND_API_KEY
    const resendFromEmail = process.env.RESEND_FROM_EMAIL
    const resendToEmail = process.env.RESEND_TO_EMAIL || resendFromEmail

    if (resendApiKey && resendFromEmail && resendToEmail) {
      try {
        const resend = new Resend(resendApiKey)
        const subject = dogName ? `Nouvelle demande de réservation — ${dogName}` : 'Nouvelle demande de contact'
        const lines = [
          `Nom : ${fullName}`,
          `E-mail : ${email}`,
          phone ? `Téléphone : ${phone}` : null,
          dogName ? `Chien : ${dogName}` : null,
          housingType ? `Logement : ${housingType}` : null,
          hasGarden === null ? null : `Jardin : ${hasGarden ? 'oui' : 'non'}`,
          hasChildren === null ? null : `Enfants : ${hasChildren ? 'oui' : 'non'}`,
          otherPets ? `Autres animaux : ${otherPets}` : null,
          message ? `\nMessage :\n${message}` : null,
        ].filter(Boolean)

        await resend.emails.send({
          from: resendFromEmail,
          to: resendToEmail,
          replyTo: email,
          subject,
          text: lines.join('\n'),
        })
      } catch (e) {
        console.error('Unable to send reservation notification email:', e)
      }
    } else {
      console.error('Reservation notification email not sent: configure RESEND_API_KEY and RESEND_FROM_EMAIL.')
    }

    // If payments enabled, create a Stripe Checkout session for the deposit
    const paymentsEnabled = process.env.PAYMENTS_ENABLED === 'true' || Boolean(process.env.STRIPE_SECRET_KEY)
    const depositCents = Number(process.env.RESERVATION_DEPOSIT_CENTS || '25000')

    if (paymentsEnabled && stripe) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afm-affm.vercel.app'
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Acompte de réservation - chiot',
                description: `Acompte pour la réservation de ${dogName || 'un chiot'}`,
              },
              unit_amount: depositCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          reservation_request_id: String(reservation.id),
        },
        success_url: `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/panier`,
      })

      return NextResponse.json({ received: true, checkoutUrl: session.url }, { headers: jsonHeaders })
    }

    return NextResponse.json({ received: true }, { headers: jsonHeaders })
  } catch (error: any) {
    console.error('Unable to record a reservation request:', error)
    return NextResponse.json({ error: 'Votre demande n’a pas pu être enregistrée. Merci de réessayer.' }, { status: 500, headers: jsonHeaders })
  }
}
