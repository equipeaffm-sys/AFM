'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Share2, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/lib/constants'
import { useCurrency } from '@/components/CurrencyContext'
import { useSavedProducts } from '@/context/SavedProductsContext'

export default function WishlistPage() {
  const [sharedIds, setSharedIds] = useState<string[] | null>(null)
  const [products, setProducts] = useState<Product[]>([])
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

  const productIds = useMemo(
    () => (sharedIds === null ? favoriteIds : sharedIds),
    [favoriteIds, sharedIds]
  )
  const idsKey = productIds.join(',')

  useEffect(() => {
    if (!isHydrated) return
    let cancelled = false
    const loadProducts = async () => {
      setLoading(true)
      if (!productIds.length) {
        setProducts([])
        setLoading(false)
        return
      }

      try {
        const { data, error } = await createClient()
          .from('products')
          .select('*')
          .in('id', productIds)
          .eq('is_active', true)

        if (error) throw error
        if (!cancelled) {
          const availableProducts = data || []
          const byId = new Map(availableProducts.map((product) => [product.id, product as Product]))
          setProducts(productIds.map((id) => byId.get(id)).filter((product): product is Product => !!product))
        }
      } catch (error) {
        console.error('Unable to load wishlist products:', error)
        if (!cancelled) toast.error('Impossible de charger les articles enregistrés.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProducts()
    return () => {
      cancelled = true
    }
  }, [idsKey, isHydrated, productIds, sharedIds])

  const shareWishlist = async () => {
    const url = `${window.location.origin}/wishlist?ids=${encodeURIComponent(productIds.join(','))}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Ma liste d’envies L&M', url })
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
              {isSharedList ? 'Liste partagée' : 'Ma liste d’envies'}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {isSharedList
                ? 'Une sélection de produits Maison L&M partagée avec vous.'
                : 'Enregistrez vos pièces préférées sur cet appareil et retrouvez-les ici.'}
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
              {isSharedList ? 'Cette liste ne contient aucun article disponible.' : 'Votre liste est encore vide.'}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
              {isSharedList
                ? 'Les articles désactivés ou retirés du catalogue ne sont pas affichés.'
                : 'Touchez le cœur sur un article du catalogue pour le retrouver ici.'}
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#c2b18f] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-950 transition-colors hover:bg-[#d6c8aa]"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Découvrir le catalogue
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => {
              const isFavorite = favoriteIds.includes(product.id)
              return (
                <article key={product.id} className="overflow-hidden rounded-xl border border-white/[0.09] bg-[#242523]">
                  <div className="relative aspect-[4/5] bg-[#2d2e2b]">
                    <Link href={`/products/${product.id}`} aria-label={`Voir ${product.title}`}>
                      {product.images?.[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                        />
                      )}
                    </Link>
                    {!isSharedList && (
                      <button
                        type="button"
                        onClick={() => toggleFavorite(product.id)}
                        aria-label="Retirer des favoris"
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#191a19]/90 text-rose-300 backdrop-blur"
                      >
                        <Heart className="h-4 w-4 fill-current" aria-hidden="true" />
                      </button>
                    )}
                    {isSharedList && (
                      <button
                        type="button"
                        onClick={() => toggleFavorite(product.id)}
                        aria-pressed={isFavorite}
                        aria-label={`${isFavorite ? 'Retirer des' : 'Ajouter aux'} favoris`}
                        className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#191a19]/90 backdrop-blur ${
                          isFavorite ? 'text-rose-300' : 'text-zinc-200'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 p-3 sm:p-4">
                    <p className="text-[10px] uppercase tracking-wider text-[#c2b18f]">{product.category}</p>
                    <Link href={`/products/${product.id}`} className="line-clamp-2 font-serif text-sm text-zinc-100 hover:text-[#d6c8aa]">
                      {product.title}
                    </Link>
                    <p className="font-serif font-semibold text-[#d6c8aa]">
                      {formatPrice(product.sale_price_cents || product.price_cents)}
                    </p>
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
