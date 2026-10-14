import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2022-11-15' }) : null;

async function computeLineItemsFromDb(items: { id: string; quantity: number }[]) {
  const supabase = createClient();
  const ids = items.map((i) => i.id);
  const { data, error } = await supabase.from('products').select('id, name, price_cents').in('id', ids);

  if (error) {
    throw new Error('Impossible de récupérer les produits côté serveur: ' + error.message);
  }

  if (!data || data.length === 0) {
    throw new Error('Aucun produit trouvé pour les identifiants fournis.');
  }

  const priceMap = new Map<string, { name: string; price_cents: number }>();
  for (const product of data) {
    const productId = String(product.id);
    // @ts-ignore
    priceMap.set(productId, {
      name: product.name,
      // @ts-ignore
      price_cents: Number(product.price_cents),
    });
  }

  return items.map((entry) => {
    const product = priceMap.get(String(entry.id));
    if (!product) {
      throw new Error(`Produit introuvable ou prix manquant pour l'id ${entry.id}`);
    }

    return {
      price_data: {
        currency: 'eur',
        product_data: { name: product.name },
        unit_amount: Number(product.price_cents),
      },
      quantity: entry.quantity,
    };
  });
}

export async function GET() {
  const enabled = (process.env.PAYMENTS_ENABLED === 'true' || Boolean(process.env.STRIPE_SECRET_KEY)) && Boolean(stripeSecret);
  return NextResponse.json({ enabled });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const isReservation = Boolean(body.purpose === 'reservation_de_chiot' || body.reservation === true || body.metadata?.purpose === 'reservation_de_chiot');

    if (isReservation) {
      const consent = Boolean(body.consent);
      if (!consent) {
        return NextResponse.json({ error: "Consentement au certificat d'engagement requis pour procéder." }, { status: 400 });
      }

      if (!stripeSecret || !stripe) {
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
        success_url: body.successUrl || `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: body.cancelUrl || `${siteUrl}/panier`,
      });

      return NextResponse.json({ url: session.url });
    }

    const items: { id: string; quantity: number }[] = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: 'Aucun article fourni pour le paiement.' }, { status: 400 });
    }

    if (!stripeSecret || !stripe) {
      return NextResponse.json({ error: 'Configuration Stripe manquante côté serveur.' }, { status: 500 });
    }

    const line_items = await computeLineItemsFromDb(items);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afm-affm.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      metadata: {
        ...(body.metadata || {}),
      },
      success_url: body.successUrl || `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: body.cancelUrl || `${siteUrl}/panier`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
