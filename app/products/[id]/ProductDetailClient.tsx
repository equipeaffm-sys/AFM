'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Check,
  Layers,
  AlertTriangle,
} from 'lucide-react'
import { useCart } from '@/components/CartContext'
import { useCurrency } from '@/components/CurrencyContext'
import { useLanguage } from '@/components/LanguageContext'
import { useSavedProducts } from '@/context/SavedProductsContext'
import { BLUR_DATA_URL, Product } from '@/lib/constants'

interface Variant {
  id: string
  product_id: string
  sku: string
  title: string
  price_override_cents?: number | null
  stock: number
  attributes: {
    color?: string
    size?: string
    material?: string
  }
}

export default function ProductDetailClient({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<Variant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [hoverZoom, setHoverZoom] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 })
  const [showStickyBar, setShowStickyBar] = useState(false)

  const primaryBuyButtonRef = useRef<HTMLButtonElement | null>(null)

  const { addItem, openCart } = useCart()
  const { markViewed } = useSavedProducts()
  const { formatPrice } = useCurrency()
  const { t } = useLanguage()

  useEffect(() => {
    async function fetchProductAndVariants() {
      try {
        const supabase = createClient()
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (prodData) {
          setProduct(prodData)
          markViewed(prodData.id)
        }

        const { data: varData } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId)

        if (varData && varData.length > 0) {
          setVariants(varData)
          setSelectedVariant(varData[0])
        }
      } catch {
        setProduct(null)
        setVariants([])
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProductAndVariants()
    }
  }, [productId, markViewed])

  // Scroll listener for Mobile Sticky Add-to-Cart Bar
  useEffect(() => {
    const handleScroll = () => {
      if (primaryBuyButtonRef.current) {
        const rect = primaryBuyButtonRef.current.getBoundingClientRect()
        setShowStickyBar(rect.bottom < 0)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const activePriceCents = selectedVariant?.price_override_cents ?? product?.sale_price_cents ?? product?.price_cents ?? 0
  const originalPriceCents = product?.sale_price_cents ? product.price_cents : null
  const activeStock = selectedVariant ? selectedVariant.stock : product?.stock ?? 0

  const handleAddToCart = () => {
    if (!product) return

    addItem({
      id: selectedVariant ? `${product.id}-v${selectedVariant.id}` : product.id,
      title: selectedVariant ? `${product.title} (${selectedVariant.title})` : product.title,
      price_cents: activePriceCents,
      image: product.images[0] || '',
      category: product.category,
      quantity: 1,
    })
    setAddedToCart(true)
    openCart()
    setTimeout(() => {
      setAddedToCart(false)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="bg-[#191a19] text-zinc-200 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="h-4 w-36 bg-white/[0.08] rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="h-[500px] w-full bg-[#2d2e2b] rounded-2xl" />
            <div className="space-y-6 bg-[#242523] p-8 rounded-2xl border border-white/[0.08]">
              <div className="h-8 w-3/4 bg-white/[0.08] rounded" />
              <div className="h-6 w-1/3 bg-white/[0.08] rounded" />
              <div className="h-24 w-full bg-white/[0.04] rounded" />
              <div className="h-12 w-full bg-white/[0.08] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#191a19] text-zinc-200 space-y-4">
        <p className="font-serif text-xl">Produit non trouvé.</p>
        <Link href="/products" className="text-[#C5A059] hover:underline text-sm">
          &larr; Retour au catalogue
        </Link>
      </div>
    )
  }

  const galleryImages = product.images || []

  // Schema.org Structured Data JSON-LD
  const jsonLdData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    image: galleryImages[0],
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: 'Maison L&M',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: (activePriceCents / 100).toFixed(2),
      availability: activeStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <div className="bg-[#191a19] text-zinc-200 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb Back Link */}
        <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <Link href="/" className="transition-colors hover:text-[#c2b18f]">Accueil</Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/products?category=${encodeURIComponent(product.category)}`}
            className="transition-colors hover:text-[#c2b18f]"
          >
            {product.category}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="max-w-[55vw] truncate text-zinc-300">{product.title}</span>
          <Link
            href="/products"
            className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-[#c2b18f]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t.catalog}
          </Link>
        </nav>

        {/* Product Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Gallery Section with Zoom Effect & AR Action Buttons */}
          <div className="space-y-4">
            <div
              className="relative h-[420px] sm:h-[600px] w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#2d2e2b] shadow-xl cursor-zoom-in group"
              onPointerMove={(event) => {
                if (event.pointerType !== 'mouse') return
                const rect = event.currentTarget.getBoundingClientRect()
                setZoomOrigin({
                  x: ((event.clientX - rect.left) / rect.width) * 100,
                  y: ((event.clientY - rect.top) / rect.height) * 100,
                })
                setHoverZoom(true)
              }}
              onPointerLeave={() => setHoverZoom(false)}
              onClick={() => {
                if (window.matchMedia('(hover: none)').matches) {
                  setIsZoomed((zoomed) => !zoomed)
                }
              }}
            >
              {galleryImages.length > 0 && (
                <Image
                  src={galleryImages[selectedImageIndex] || galleryImages[0]}
                  alt={product.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className={`object-cover transition-transform duration-500 ease-out ${
                    isZoomed || hoverZoom ? 'scale-150' : 'scale-100'
                  }`}
                  style={{ transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }}
                />
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3.5 py-1.5 bg-[#191a19]/90 backdrop-blur-md text-[#c2b18f] text-xs uppercase tracking-wider rounded-full font-semibold">
                  {product.category}
                </span>
              </div>


            </div>

            {/* Mobile Touch Dot Indicators */}
            {galleryImages.length > 1 && (
              <div className="flex items-center justify-center gap-2 pt-1">
                {galleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      selectedImageIndex === idx ? 'w-6 bg-[#b6a17d]' : 'w-2 bg-zinc-600'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Gallery Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="hidden sm:flex gap-4 overflow-x-auto pb-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImageIndex(idx)
                      setIsZoomed(false)
                    }}
                    className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-[#8f8065] scale-95 shadow-md'
                        : 'border-white/[0.1] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} vue ${idx + 1}`}
                      fill
                      sizes="96px"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-8 bg-[#222321] p-8 sm:p-10 border border-white/[0.08] rounded-2xl shadow-xl">
            <div className="space-y-3">
              <h1 className="fluid-heading letterspace-hover font-serif font-medium text-zinc-100 leading-tight">
              {product.title}
              </h1>

              {/* Price & Sale Pricing Display */}
              <div className="pt-2 flex items-baseline gap-3">
                {originalPriceCents ? (
                  <>
                    <span className="text-2xl font-serif font-semibold text-[#c2b18f]">
                      {formatPrice(activePriceCents)}
                    </span>
                    <span className="text-sm font-mono text-zinc-400 line-through">
                      {formatPrice(originalPriceCents)}
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#b6a17d] text-[#191a19] text-[10px] uppercase font-bold tracking-widest rounded-full">
                      Prix réduit
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-serif font-semibold text-[#c2b18f]">
                    {formatPrice(activePriceCents)}
                  </span>
                )}
              </div>
            </div>

            {/* Product Variant Selector */}
            {variants.length > 0 && (
              <div className="pb-4 space-y-3">
                <span className="text-xs uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#b6a17d]" />
                  Variantes Disponibles
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                        selectedVariant?.id === v.id
                          ? 'bg-[#665d4d] text-[#eeeae2] border-[#665d4d] shadow-md'
                          : 'bg-[#292a27] text-zinc-300 border-white/[0.1] hover:border-[#8f8065]'
                      }`}
                    >
                      {v.title}
                      {v.price_override_cents && (
                        <span className="ml-2 text-[10px] text-[#c2b18f]">
                          ({formatPrice(v.price_override_cents)})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-b border-white/[0.08] pb-6 space-y-4">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Description</h2>
              <p className="editorial-copy text-zinc-300 text-sm font-light leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Scarcity & Low Stock Badge */}
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeStock > 0 ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              {activeStock <= 3 && activeStock > 0 ? (
                <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Plus que {activeStock} exemplaires disponibles !
                </span>
              ) : (
                <span className="text-xs text-zinc-300 font-medium">
                  {activeStock > 0
                    ? `En stock (${activeStock} pièces disponibles)`
                    : 'Rupture de stock temporaire'}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-2">
              <button
                ref={primaryBuyButtonRef}
                onClick={handleAddToCart}
                disabled={activeStock === 0}
                className={`button-sheen w-full py-4 px-8 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 shadow-xl ${
                  addedToCart
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#665d4d] text-[#eeeae2] hover:bg-[#77705f]'
                } disabled:opacity-50`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-5 h-5" />
                    {t.addedToCart}
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span className="button-label">
                      <span>{t.addToCart}</span>
                      <span aria-hidden="true">{t.addToCart}</span>
                    </span>
                  </>
                )}
              </button>

              <Link
                href="/login"
                className="w-full py-4 px-8 border border-white/[0.12] hover:border-[#8f8065] text-zinc-300 hover:text-[#d0c2a4] rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center bg-[#292a27]"
              >
                {t.bookAppointment}
              </Link>
            </div>

            {/* Reassurance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#292a27] border border-white/[0.08]">
                <Truck className="w-5 h-5 text-[#b6a17d] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">{t.secureDelivery}</h3>
                  <p className="text-[11px] text-zinc-400 font-light mt-0.5">{t.secureDeliveryDesc}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#292a27] border border-white/[0.08]">
                <ShieldCheck className="w-5 h-5 text-[#b6a17d] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">{t.certificate}</h3>
                  <p className="text-[11px] text-zinc-400 font-light mt-0.5">{t.certificateDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Mobile Add-to-Cart Bar */}
      {showStickyBar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#191a19]/95 backdrop-blur-md border-t border-white/[0.08] p-4 shadow-2xl flex items-center justify-between gap-4 animate-slideUp">
          <div>
            <h4 className="text-xs font-serif font-bold text-zinc-100 line-clamp-1">{product.title}</h4>
            <span className="text-xs font-serif font-semibold text-[#c2b18f]">
              {formatPrice(activePriceCents)}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={activeStock === 0}
            className="py-2.5 px-5 bg-[#665d4d] text-[#eeeae2] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shrink-0 hover:bg-[#77705f]"
          >
            {addedToCart ? 'Ajouté !' : 'Ajouter au Panier'}
          </button>
        </div>
      )}


    </div>
  )
}
