import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import {
  activeShippingOptions,
  collectAllowedCountries,
  evaluateShippingConfiguration,
  type ShippingConfigurationIssue,
  type ShippingZone,
  type TaxRate,
} from '@/lib/shipping'

interface CheckoutItem {
  id: string
  quantity: number
}

interface CheckoutConfiguration {
  enabled: boolean
  countries: string[]
  shippingOptions: { shipping_rate: string }[]
  siteOrigin: string | null
  issues: ShippingConfigurationIssue[]
}

async function getCheckoutConfiguration(): Promise<CheckoutConfiguration> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const paymentsEnabled = process.env.PAYMENTS_ENABLED === 'true'
  const hasSecrets = Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  let siteOrigin: string | null = null
  if (siteUrl) {
    try {
      const parsedUrl = new URL(siteUrl)
      if (
        parsedUrl.protocol === 'https:' ||
        (parsedUrl.protocol === 'http:' && parsedUrl.hostname === 'localhost')
      ) {
        siteOrigin = parsedUrl.origin
      }
    } catch {
      siteOrigin = null
    }
  }

  const locked: CheckoutConfiguration = {
    enabled: false,
    countries: [],
    shippingOptions: [],
    siteOrigin,
    issues: [],
  }

  if (!paymentsEnabled || !hasSecrets || !siteOrigin) {
    return locked
  }

  // Load shipping zones and per-country tax rules from Supabase (service role).
  // Checkout stays disabled until every active zone has a valid Stripe shipping
  // rate and every served country has an active, decided tax rule. There is no
  // fallback to a fictional price, fee, threshold or tax: a missing or invalid
  // rule only ever results in a locked checkout and a clear message.
  let zones: ShippingZone[] = []
  let taxRates: TaxRate[] = []
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/admin')
    const [zoneResult, taxResult] = await Promise.all([
      supabaseAdmin.from('shipping_zones').select('*').order('sort_order', { ascending: true }),
      supabaseAdmin.from('tax_rates').select('country_code, rate_percent, is_active'),
    ])
    if (zoneResult.error) throw zoneResult.error
    if (taxResult.error) throw taxResult.error
    zones = (zoneResult.data || []) as ShippingZone[]
    taxRates = (taxResult.data || []) as TaxRate[]
  } catch (error) {
    console.error('Unable to load shipping and tax configuration:', error)
    return locked
  }

  const issues = evaluateShippingConfiguration(zones, taxRates)
  const countries = collectAllowedCountries(zones)
  const shippingOptions = activeShippingOptions(zones)

  return {
    enabled: issues.length === 0 && countries.length > 0 && shippingOptions.length > 0,
    countries,
    shippingOptions,
    siteOrigin,
    issues,
  }
}


function parseItems(value: unknown): CheckoutItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) return null

  const items: CheckoutItem[] = []
  for (const item of value) {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('id' in item) ||
      !('quantity' in item) ||
      typeof item.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id) ||
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      return null
    }
    items.push({ id: item.id, quantity: item.quantity })
  }
  return items
}

export async function GET() {
  const configuration = await getCheckoutConfiguration()
  return NextResponse.json(
    { enabled: configuration.enabled },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Veuillez vous connecter pour valider votre commande.' },
      { status: 401 }
    )
  }

  const configuration = await getCheckoutConfiguration()
  if (!configuration.enabled || !configuration.siteOrigin) {
    return NextResponse.json(
      {
        error:
          'Le paiement est encore désactivé. Les zones de livraison et les règles fiscales doivent être configurées et valides dans l’administration.',
      },
      { status: 503 }
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'La requête de commande est invalide.' }, { status: 400 })
  }

  const items = parseItems(
    typeof payload === 'object' && payload !== null && 'items' in payload
      ? payload.items
      : null
  )
  if (!items) {
    return NextResponse.json({ error: 'Le panier est vide ou invalide.' }, { status: 400 })
  }

  let orderId: string | null = null
  try {
    const [{ supabaseAdmin }] = await Promise.all([import('@/lib/supabase/admin')])
    const { data: createdOrderId, error: orderError } = await supabaseAdmin.rpc(
      'create_pending_checkout_order',
      {
        p_user_id: user.id,
        p_items: items.map(({ id, quantity }) => ({ product_id: id, quantity })),
      }
    )

    if (orderError || typeof createdOrderId !== 'string') {
      console.error('Unable to create a reserved checkout order:', orderError)
      return NextResponse.json(
        { error: 'Impossible de préparer la commande. Vérifiez la configuration Supabase.' },
        { status: 503 }
      )
    }
    orderId = createdOrderId

    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('quantity, unit_price_cents, products!inner(title)')
      .eq('order_id', orderId)

    if (itemsError || !orderItems || orderItems.length === 0) {
      throw new Error(`Unable to load reserved order items: ${itemsError?.message || 'empty order'}`)
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = orderItems.map((item) => {
      const linkedProducts = item.products
      const product = Array.isArray(linkedProducts) ? linkedProducts[0] : linkedProducts
      if (!product || typeof product.title !== 'string') {
        throw new Error('A checkout item has no linked product title.')
      }

      return {
        quantity: item.quantity,
        price_data: {
          currency: 'eur',
          unit_amount: item.unit_price_cents,
          product_data: { name: product.title },
        },
      }
    })

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is missing after checkout configuration validation.')
    const stripe = new Stripe(stripeKey)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'auto',
      customer_email: user.email || undefined,
      client_reference_id: orderId,
      metadata: { order_id: orderId, user_id: user.id },
      payment_intent_data: { metadata: { order_id: orderId, user_id: user.id } },
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries:
          configuration.countries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      },
      shipping_options: configuration.shippingOptions,
      success_url: `${configuration.siteOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${configuration.siteOrigin}/checkout/cancel?order_id=${encodeURIComponent(orderId)}`,
    })
    if (!session.url) {
      await stripe.checkout.sessions.expire(session.id)
      throw new Error('Stripe created a Checkout session without a redirect URL.')
    }

    const { data: savedOrder, error: saveSessionError } = await supabaseAdmin
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', orderId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()

    if (saveSessionError || !savedOrder) {
      await stripe.checkout.sessions.expire(session.id)
      throw new Error(
        `Unable to link Stripe session to order: ${saveSessionError?.message || 'order not pending'}`
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Unable to start Stripe Checkout:', error)
    if (orderId) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase/admin')
        const { error: releaseError } = await supabaseAdmin.rpc(
          'release_pending_checkout_order',
          { p_order_id: orderId }
        )
        if (releaseError) {
          console.error('Unable to release stock for failed checkout:', releaseError)
        }
      } catch (releaseError) {
        console.error('Unable to load the Supabase admin client to release stock:', releaseError)
      }
    }
    return NextResponse.json(
      { error: 'Le paiement n’a pas pu être préparé. Aucun montant n’a été débité.' },
      { status: 502 }
    )
  }
}
