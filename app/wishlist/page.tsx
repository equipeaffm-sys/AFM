'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Share2, PawPrint } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  formatAgeLabel,
  formatDogPrice,
  type Dog,
} from '@/lib/dogs'
import { BLUR_DATA_URL } from '@/lib/constants'
import { useCurrency } from '@/components/CurrencyContext'
import { useSavedProducts } from '@/context/SavedProductsContext'

const STATUS_STYLES: Record<Dog['status'], string> = {
  available: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
  reserved: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
  adopted: 'border-zinc-400/30 bg-zinc-500/15 text-zinc-300',
}

export default function WishlistPage() {
  const [sharedIds, setSharedIds] = useState<string[] | null>(null)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const { favoriteIds, toggleFavorite, isHydrated } = useSavedProducts()
  const { formatPrice } = useCurrency()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('ids')) return
    const ids = Array.from(new Set((params.get('ids') || '').split(',').filter((id) => id.length > 0 && id.length <= 80)))
      .slice(0, 100)
    setSharedIds(ids)
  }, [])

  const dogIds = useMemo(
    () => (sharedIds === null ? favoriteIds : sharedIds),
    [favoriteIds, sharedIds]
  )
  const idsKey = dogIds.join(',')

  useEffect(() => {
    if (!isHydrated) return
    let cancelled = false
    const loadDogs = async () => {
      setLoading(true)
      if (!dogIds.length) {
        setDogs([])
        setLoading(false)
        return
      }

      try {
        const { data, error } = await createClient()
          .from('dogs')
          .select('*')
          .in('id', dogIds)
          .eq('is_published', true)

        if (error) throw error
        if (!cancelled) {
          const availableDogs = data || []
          const byId = new Map(availableDogs.map((dog) => [dog.id, dog as Dog]))
          setDogs(dogIds.map((id) => byId.get(id)).filter((dog): dog is Dog => !!dog))
        }
      } catch (error) {
        console.error('Unable to load saved dogs:', error)
        if (!cancelled) toast.error('Impossible de charger les compagnons enregistrés.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadDogs()
    return () => {
      cancelled = true
    }
  }, [idsKey, isHydrated, dogIds, sharedIds])

  const shareWishlist = async () => {
    const url = `${window.location.origin}/wishlist?ids=${encodeURIComponent(dogIds.join(','))}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Mes compagnons favoris — Maison L&M', url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Lien de partage copié.')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('Unable to share wishlist:', error)
      toast.error('Impossible de partager la liste depuis ce navigateur.')
    }
  }

  const isSharedList = sharedIds !== null

  return (
    <main className="min-h-[70vh] bg-[#191a19] px-4 py-12 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 border-b border-white/[0.09] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="font-serif text-xs uppercase tracking-[0.25em] text-[#c2b18f] hover:text-white">
              L&amp;M Boutique
            </Link>
            <h1 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">
              {isSharedList ? 'Compagnons partagés' : 'Mes favoris'}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {isSharedList
                ? 'Une sélection de compagnons Maison L&M partagée avec vous.'
                : 'Enregistrez vos compagnons préférés sur cet appareil et retrouvez-les ici.'}
            </p>
          </div>
          {!isSharedList && productIds.length > 0 && (
            <button
              type="button"
              onClick={shareWishlist}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#8f8065]/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#d6c8aa] transition-colors hover:bg-white/[0.05]"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Partager ma liste
            </button>
          )}
        </header>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="aspect-[4/5] animate-pulse rounded-xl bg-white/[0.06]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-6 py-16 text-center">
            <Heart className="mx-auto h-9 w-9 text-zinc-600" aria-hidden="true" />
            <h2 className="mt-4 font-serif text-xl">
              {isSharedList ? 'Cette liste ne contient aucun compagnon disponible.' : 'Votre liste de favoris est encore vide.'}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
              {isSharedList
                ? 'Les compagnons partagés n’ont pas pu être retrouvés.'
                : 'Touchez le cœur sur une fiche pour retrouver le compagnon ici.'}
            </p>
            <Link
              href="/nos-chiens"
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#c2b18f] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-950 transition-colors hover:bg-[#d6c8aa]"
            >
              <PawPrint className="h-4 w-4" aria-hidden="true" />
              Découvrir nos chiens
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {dogs.map((dog) => {
              const isFavorite = favoriteIds.includes(dog.id)
              const ageLabel = formatAgeLabel(dog.birth_date)
              const priceLabel = formatDogPrice(dog.price_cents, dog.price_on_request, formatPrice)
              const coverImage = dog.images?.[0]
              return (
                <article key={dog.id} className="overflow-hidden rounded-xl border border-white/[0.09] bg-[#242523]">
                  <div className="relative aspect-[4/5] bg-[#2d2e2b]">
                    <Link href={`/nos-chiens/${dog.slug}`} aria-label={`Voir ${dog.name}`}>
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt={dog.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl text-zinc-600">🐾</div>
                      )}
                    </Link>
                    {!isSharedList && (
                      <button
                        type="button"
                        onClick={() => toggleFavorite(dog.id)}
                        aria-label={`Retirer ${dog.name} des favoris`}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#191a19]/90 text-rose-300 backdrop-blur"
                      >
                        <Heart className="h-4 w-4 fill-current" aria-hidden="true" />
                      </button>
                    )}
                    {isSharedList && (
                      <button
                        type="button"
                        onClick={() => toggleFavorite(dog.id)}
                        aria-pressed={isFavorite}
                        aria-label={`${isFavorite ? 'Retirer des' : 'Ajouter aux'} favoris`}
                        className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#191a19]/90 backdrop-blur ${
                          isFavorite ? 'text-rose-300' : 'text-zinc-200'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} aria-hidden="true" />
                      </button>
                    )}
                    <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                      <span className="rounded-full bg-[#191a19]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#c2b18f] backdrop-blur-md">
                        {CATEGORY_LABELS[dog.category]}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${STATUS_STYLES[dog.status]}`}>
                        {STATUS_LABELS[dog.status]}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 p-3 sm:p-4">
                    <Link href={`/nos-chiens/${dog.slug}`} className="line-clamp-2 font-serif text-sm text-zinc-100 hover:text-[#d6c8aa]">
                      {dog.name}
                    </Link>
                    <p className="text-[11px] font-light text-zinc-400">
                      {[dog.breed, ageLabel].filter(Boolean).join(' · ') || 'Compagnon Maison L&M'}
                    </p>
                    <p className="font-serif font-semibold text-[#d6c8aa]">{priceLabel}</p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
