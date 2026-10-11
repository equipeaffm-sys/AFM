'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCurrency } from '@/components/CurrencyContext'

interface TrackResult {
  id: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  total_cents: number
  created_at: string
}

const STATUS_LABELS: Record<TrackResult['status'], string> = {
  pending: 'En attente',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

export default function TrackOrderPage() {
  const { formatPrice } = useCurrency()
  const router = useRouter()
  const [orderInput, setOrderInput] = useState('')
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSearched(false)
    setErrorMessage('')
    setResult(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirectTo=/track-order')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select('id, status, total_cents, created_at')
        .eq('id', orderInput.trim())
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      setResult(data)
    } catch (error) {
      console.error('Unable to look up order:', error)
      setErrorMessage('Impossible de consulter cette commande pour le moment.')
    } finally {
      setSearched(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#191a19] px-4 py-16 text-zinc-100 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-[#c2b18f]"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;accueil
        </Link>

        <div className="text-center space-y-3">
          <h1 className="font-serif text-3xl font-bold text-[#eeeae2] sm:text-5xl">
            Suivi de commande
          </h1>
          <p className="text-sm font-light text-zinc-400">
            Connectez-vous pour consulter le statut d&apos;une commande liée à votre compte.
          </p>
        </div>

        <form
          onSubmit={handleTrackSubmit}
          className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-white/[0.09] bg-[#222321] p-6 shadow-xl sm:p-8"
        >
          <div>
            <label htmlFor="order-id" className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-300">
              Identifiant de commande
            </label>
            <input
              id="order-id"
              type="text"
              placeholder="Identifiant de commande"
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-[#191a19] px-4 py-3 font-mono text-zinc-200 focus:border-[#8f8065] focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#665d4d] py-4 text-xs font-bold uppercase tracking-widest text-zinc-100 shadow-xl transition-all hover:bg-[#756a56] disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Recherche…' : 'Consulter le statut'}
          </button>
        </form>

        {searched && (
          <div className="mx-auto max-w-2xl space-y-3 rounded-2xl border border-white/[0.09] bg-[#222321] p-6 text-center">
            {errorMessage ? (
              <>
                <AlertCircle className="w-7 h-7 text-red-600 mx-auto" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </>
            ) : result ? (
              <>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Commande {result.id}</p>
                <p className="font-serif text-lg font-bold text-zinc-100">
                  {STATUS_LABELS[result.status] || result.status}
                </p>
                <p className="text-sm text-zinc-400">
                  {new Date(result.created_at).toLocaleDateString('fr-FR')} · {formatPrice(result.total_cents)}
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-7 h-7 text-zinc-400 mx-auto" />
                <p className="text-sm text-zinc-400">Aucune commande correspondante trouvée pour votre compte.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
