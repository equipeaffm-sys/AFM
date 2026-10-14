import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecret || '', { apiVersion: '2022-11-15' });

// Helper to compute total from product rows
async function computeLineItemsFromDb(items: { id: string; quantity: number }[]) {
  const supabase = createClient();
  const ids = items.map((i) => i.id);
  const { data, error } = await supabase.from('products').select('id, name, price_cents').in('id', ids);
  if (error) throw new Error('Impossible de récupérer les produits côté serveur: ' + error.message);
  if (!data || data.length === 0) throw new Error('Aucun produit trouvé pour les identifiants fournis.');

  const priceMap = new Map<string, { name: string; price_cents: number }>();
  for (const p of data) {
    // @ts-ignore
    priceMap.set(String(p.id), { name: p.name, price_cents: Number(p.price_cents) });
  }

  const line_items = items.map((it) => {
    const found = priceMap.get(String(it.id));
    if (!found) throw new Error(`Produit introuvable ou prix manquant pour l'id ${it.id}`);
    return {
      price_data: {
        currency: 'eur',
        product_data: { name: found.name },
        unit_amount: Number(found.price_cents),
      },
      quantity: it.quantity,
    };
  });

  return line_items;
}

export async function GET() {
  // Return whether checkout is available (used by CartDrawer)
  const enabled = (process.env.PAYMENTS_ENABLED === 'true' || !!process.env.STRIPE_SECRET_KEY) && !!stripeSecret;
  return NextResponse.json({ enabled });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Reservation flow (single fixed deposit)
    const isReservation = Boolean(body.purpose === 'reservation_de_chiot' || body.reservation === true || body.metadata?.purpose === 'reservation_de_chiot');

    if (isReservation) {
      const consent = Boolean(body.consent);
      if (!consent) {
        return NextResponse.json({ error: "Consentement au certificat d'engagement requis pour procéder." }, { status: 400 });
      }

      if (!stripeSecret) {
        return NextResponse.json({ error: 'Configuration Stripe manquante côté serveur.' }, { status: 500 });
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afm-affm.vercel.app';
      const depositCents = Number(process.env.RESERVATION_DEPOSIT_CENTS || '25000');

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
          ...(body.metadata || {}),
          purpose: 'reservation_de_chiot',
        },
        success_url: body.successUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://afm-affm.vercel.app'}/merci?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: body.cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://afm-affm.vercel.app'}/panier`,
      });

      return NextResponse.json({ url: session.url });
    }

    // Standard cart checkout flow: expects items: [{id, quantity}]
    const items: { id: string; quantity: number }[] = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: 'Aucun article fourni pour le paiement.' }, { status: 400 });
    }

    if (!stripeSecret) {
      return NextResponse.json({ error: 'Configuration Stripe manquante côté serveur.' }, { status: 500 });
    }

    // Compute line items from DB to avoid trusting client prices
    const line_items = await computeLineItemsFromDb(items);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      metadata: {
        ...(body.metadata || {}),
      },
      success_url: body.successUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://afm-affm.vercel.app'}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: body.cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://afm-affm.vercel.app'}/panier`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
