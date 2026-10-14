import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecret || '', { apiVersion: '2022-11-15' });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { consent, successUrl, cancelUrl, metadata } = body;

    if (!consent) {
      return NextResponse.json({ error: 'Consentement au certificat d\'engagement requis pour procéder.' }, { status: 400 });
    }

    if (!stripeSecret) {
      return NextResponse.json({ error: 'Configuration Stripe manquante côté serveur.' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afm-affm.vercel.app';
    const depositCents = 25000;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Acompte de réservation - chiot',
              description: 'Acompte garantissant la réservation du chiot (non remboursable en cas de désistement injustifié).',
            },
            unit_amount: depositCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        ...(metadata || {}),
        purpose: 'reservation_de_chiot',
      },
      success_url: successUrl || `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${siteUrl}/panier`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
