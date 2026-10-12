import Link from 'next/link'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

interface SuccessPageProps {
  searchParams: { session_id?: string }
}

export const dynamic = 'force-dynamic'

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  let paymentStatus: 'confirmed' | 'processing' | 'unverified' = 'unverified'
  const sessionId = searchParams.session_id
  const stripeKey = process.env.STRIPE_SECRET_KEY

  if (sessionId && stripeKey) {
    try {
      const supabase = createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error('Unable to authenticate a checkout success visit:', authError)
      } else if (user) {
        const stripe = new Stripe(stripeKey)
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        const orderId = session.metadata?.order_id

        if (session.metadata?.user_id === user.id && orderId) {
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .maybeSingle()

          if (orderError) {
            console.error('Unable to verify the checkout order:', orderError)
          } else if (order && session.payment_status === 'paid') {
            paymentStatus = order.status === 'paid' ? 'confirmed' : 'processing'
          }
        }
      }
    } catch (error: unknown) {
      console.error('Unable to verify the Stripe Checkout session:', error)
    }
  }

  const message =
    paymentStatus === 'confirmed'
      ? 'Votre paiement est confirmé. Vous retrouverez le détail de votre commande dans votre compte et recevrez un e-mail de confirmation.'
      : paymentStatus === 'processing'
        ? 'Stripe a reçu votre paiement. La confirmation de la commande est en cours ; ne passez pas une seconde commande.'
        : 'Le statut du paiement n’a pas pu être vérifié. Consultez votre compte ou contactez-nous avant de réessayer.'

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-zinc-950 px-4 py-16">
      <section className="w-full max-w-2xl space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-100 sm:p-12">
        <h1 className="font-serif text-3xl font-bold">
          {paymentStatus === 'confirmed'
            ? 'Paiement confirmé'
            : paymentStatus === 'processing'
              ? 'Paiement reçu'
              : 'Vérification du paiement'}
        </h1>
        <p className="text-sm text-zinc-400">{message}</p>
        <Link
          href="/account"
          className="inline-block rounded-lg border border-zinc-700 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-300 transition-colors hover:border-zinc-500"
        >
          Voir mon compte
        </Link>
      </section>
    </main>
  )
}
