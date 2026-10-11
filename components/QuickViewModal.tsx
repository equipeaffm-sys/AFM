'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ExternalLink, Layers, LoaderCircle, ShoppingBag, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { BLUR_DATA_URL, Product } from '@/lib/constants'
import { useCart } from '@/components/CartContext'
import { useCurrency } from '@/components/CurrencyContext'

interface Variant {
  id: string
  title: string
  price_override_cents?: number | null
  stock: number
  attributes?: {
    color?: string
    size?: string
    material?: string
  } | null
}

export default function QuickViewModal({
  product,
  onClose,
}: {
  product: Product | null
  onClose: () => void
}) {
  const [variants, setVariants] = useState<Variant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()
  const { formatPrice } = useCurrency()

  useEffect(() => {
    if (!product) return

    let cancelled = false
    const loadVariants = async () => {
      setVariants([])
      setSelectedVariant(null)
      setLoadingVariants(true)
      try {
        const { data, error } = await createClient()
          .from('product_variants')
          .select('id, title, price_override_cents, stock, attributes')
          .eq('product_id', product.id)
          .order('title')

        if (error) throw error
        if (!cancelled) {
          const availableVariants = (data || []) as Variant[]
          setVariants(availableVariants)
          setSelectedVariant(availableVariants[0] || null)
        }
      } catch (error) {
        console.error('Unable to load product variants for quick view:', error)
        if (!cancelled) {
          toast.error('Les variantes de cet article ne sont pas disponibles.')
        }
      } finally {
        if (!cancelled) setLoadingVariants(false)
      }
    }

    loadVariants()
    return () => {
      cancelled = true
    }
  }, [product])

  useEffect(() => {
    if (!product) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [product, onClose])

  useEffect(() => {
    if (!added) return
    const timer = window.setTimeout(() => setAdded(false), 1000)
    return () => window.clearTimeout(timer)
  }, [added])

  if (!product) return null

  const priceCents =
    selectedVariant?.price_override_cents ??
    product.sale_price_cents ??
    product.price_cents
  const stock = selectedVariant?.stock ?? product.stock
  const image = product.images?.[0] || ''

  const handleAddToCart = () => {
    if (stock <= 0) return
    addItem({
      id: selectedVariant ? `${product.id}-v${selectedVariant.id}` : product.id,
      title: selectedVariant ? `${product.title} (${selectedVariant.title})` : product.title,
      price_cents: priceCents,
      image,
      category: product.category,
    })
    setAdded(true)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        className="motion-rise relative grid max-h-[min(760px,calc(100dvh-1.5rem))] w-full max-w-4xl grid-cols-1 overflow-y-auto rounded-2xl border border-white/[0.12] bg-[#20211f] shadow-2xl sm:max-h-[min(680px,calc(100dvh-3rem))] sm:grid-cols-2 sm:overflow-hidden"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer l’aperçu"
          className="absolute right-3 top-3 z-10 rounded-full border border-white/10 bg-black/50 p-2 text-zinc-200 transition hover:bg-black/75"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="relative aspect-[4/5] bg-[#2d2e2b] sm:aspect-auto sm:min-h-[500px]">
          {image ? (
            <Image
              src={image}
              alt={product.title}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              <Layers className="h-10 w-10" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center gap-5 p-5 sm:p-8">
          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2b18f]">
              {product.category}
            </span>
            <h2 id="quick-view-title" className="font-serif text-2xl leading-tight text-zinc-100 sm:text-3xl">
              {product.title}
            </h2>
            <p className="line-clamp-4 text-sm leading-relaxed text-zinc-400">
              {product.description}
            </p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-serif text-xl font-semibold text-[#c2b18f]">
              {formatPrice(priceCents)}
            </span>
            {product.sale_price_cents && (
              <span className="font-mono text-xs text-zinc-500 line-through">
                {formatPrice(product.price_cents)}
              </span>
            )}
          </div>

          {loadingVariants ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400" role="status">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Chargement des variantes…
            </div>
          ) : variants.length > 0 ? (
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Variantes disponibles
              </legend>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={variant.stock <= 0}
                    aria-pressed={selectedVariant?.id === variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`rounded-lg border px-3 py-2 text-xs transition ${
                      selectedVariant?.id === variant.id
                        ? 'border-[#b6a17d] bg-[#66563d] text-white'
                        : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-[#8f8065]'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {variant.title}
                    {variant.stock <= 0 && ' · Épuisé'}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <p className={`text-xs ${stock > 0 ? 'text-zinc-400' : 'text-red-300'}`}>
            {stock > 0 ? `${stock} article(s) disponible(s)` : 'Actuellement indisponible'}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={stock <= 0 || loadingVariants}
              onClick={handleAddToCart}
              className={`button-sheen inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 ${
                added ? 'bg-emerald-700 text-white' : 'bg-[#66563d] text-white hover:bg-[#766446]'
              }`}
            >
              {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              {added ? 'Ajouté' : 'Ajouter au panier'}
            </button>
            <Link
              href={`/products/${product.id}`}
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-xs font-semibold text-zinc-300 transition hover:border-[#8f8065] hover:text-white"
            >
              Voir la fiche
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
