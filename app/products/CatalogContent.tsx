'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  SlidersHorizontal,
  Search,
  RotateCcw,
  Tag,
  CheckCircle2,
  ChevronDown,
  Layers,
  ArrowDown,
  Grid2X2,
  LayoutGrid,
  Eye,
  Scale,
  X
} from 'lucide-react'
import ProductSkeleton from '@/components/ProductSkeleton'
import QuickViewModal from '@/components/QuickViewModal'
import { BLUR_DATA_URL, Product } from '@/lib/constants'
import { useCurrency } from '@/components/CurrencyContext'
import { useLanguage } from '@/components/LanguageContext'

type SortOption = 'date-desc' | 'price-asc' | 'price-desc'

interface CatalogCategory {
  id: string
  name: string
  slug: string
  parent_id: string | null
  is_active: boolean
}

interface CatalogVariantPreview {
  id: string
  title: string
  attributes?: {
    color?: string
    size?: string
    material?: string
  } | null
}

const BATCH_SIZE = 6
const SCROLL_STORAGE_KEY = 'maison_lm_catalog_scroll'

function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export default function CatalogContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { formatPrice } = useCurrency()
  const { t } = useLanguage()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE)

  // Filter & Search states derived from searchParams
  const categoryParam = searchParams.get('category') || 'Tous'
  const queryParam = searchParams.get('q') || ''
  const minPriceParam = searchParams.get('minPrice') || ''
  const maxPriceParam = searchParams.get('maxPrice') || ''
  const inStockParam = searchParams.get('inStock') === 'true'
  const sortParam = (searchParams.get('sort') as SortOption) || 'date-desc'

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam)
  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [minPrice, setMinPrice] = useState(minPriceParam)
  const [maxPrice, setMaxPrice] = useState(maxPriceParam)
  const [inStockOnly, setInStockOnly] = useState(inStockParam)
  const [sortBy, setSortBy] = useState<SortOption>(sortParam)

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [gridMode, setGridMode] = useState<'compact' | 'comfortable'>('compact')
  const [variantPreviews, setVariantPreviews] = useState<Record<string, CatalogVariantPreview[]>>({})
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  useEffect(() => {
    if (!compareOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCompareOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [compareOpen])

  // Fetch product catalog
  useEffect(() => {
    async function fetchProducts() {
      try {
        const supabase = createClient()
        const [productResult, categoryResult] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('id, name, slug, parent_id, is_active')
            .eq('is_active', true)
            .order('name'),
        ])

        if (productResult.error) throw productResult.error
        if (categoryResult.error) throw categoryResult.error

        const activeCategories = categoryResult.data || []
        const activeCategoryIds = new Set(activeCategories.map((category) => category.id))
        setProducts(
          (productResult.data || []).filter(
            (product) => !product.category_id || activeCategoryIds.has(product.category_id)
          )
        )
        setCategories(activeCategories)

        const activeProductIds = (productResult.data || []).map((product) => product.id)
        if (activeProductIds.length > 0) {
          const { data: variantData, error: variantError } = await supabase
            .from('product_variants')
            .select('id, product_id, title, attributes')
            .in('product_id', activeProductIds)

          if (variantError) {
            console.error('Unable to load catalog variant previews:', variantError)
          } else {
            const previews: Record<string, CatalogVariantPreview[]> = {}
            for (const variant of variantData || []) {
              const productId = variant.product_id as string
              previews[productId] = previews[productId] || []
              previews[productId].push(variant as CatalogVariantPreview)
            }
            setVariantPreviews(previews)
          }
        } else {
          setVariantPreviews({})
        }
      } catch (error) {
        console.error('Unable to load the catalog:', error)
        setLoadError('Le catalogue ne peut pas être chargé pour le moment.')
        setProducts([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Restore scroll position on load
  useEffect(() => {
    if (!loading) {
      try {
        const savedPos = sessionStorage.getItem(SCROLL_STORAGE_KEY)
        if (savedPos) {
          setTimeout(() => {
            window.scrollTo({ top: parseInt(savedPos, 10), behavior: 'smooth' })
          }, 150)
        }
      } catch {
        // Ignore
      }
    }
  }, [loading])

  // Save scroll position when navigating away
  const handleProductClick = () => {
    try {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY.toString())
    } catch {
      // Ignore
    }
  }

  // Sync state changes to searchParams URL
  const updateQueryParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'Tous' || value === 'default') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      const searchString = params.toString()
      const query = searchString ? `?${searchString}` : ''
      router.replace(`${pathname}${query}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat)
    updateQueryParams({ category: cat === 'Tous' ? null : cat })
  }

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    updateQueryParams({ q })
  }

  const handleMinPriceChange = (val: string) => {
    setMinPrice(val)
    updateQueryParams({ minPrice: val })
  }

  const handleMaxPriceChange = (val: string) => {
    setMaxPrice(val)
    updateQueryParams({ maxPrice: val })
  }

  const handleInStockToggle = () => {
    const nextVal = !inStockOnly
    setInStockOnly(nextVal)
    updateQueryParams({ inStock: nextVal ? 'true' : null })
  }

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort)
    updateQueryParams({ sort })
  }

  const handleResetFilters = () => {
    setSelectedCategory('Tous')
    setSearchQuery('')
    setMinPrice('')
    setMaxPrice('')
    setInStockOnly(false)
    setSortBy('date-desc')
    router.replace(pathname, { scroll: false })
  }

  // Filter & Sort computation
  const activeCategory = categories.find(
    (category) => category.slug === selectedCategory || category.name === selectedCategory
  )

  const filteredProducts = products
    .filter((product) => {
      const matchesCategory =
        selectedCategory === 'Tous' ||
        (activeCategory !== undefined &&
          (product.category_id
            ? product.category_id === activeCategory.id
            : product.category === activeCategory.name))

      const searchTerms = normalizeSearchText(searchQuery).trim().split(/\s+/).filter(Boolean)
      const searchableText = normalizeSearchText(`${product.title} ${product.description}`)
      const matchesSearch = searchTerms.every((term) => searchableText.includes(term))

      const activePriceCents = product.sale_price_cents || product.price_cents
      const priceEuros = activePriceCents / 100
      const matchesMinPrice = minPrice === '' || priceEuros >= parseFloat(minPrice)
      const matchesMaxPrice = maxPrice === '' || priceEuros <= parseFloat(maxPrice)

      const matchesStock = !inStockOnly || product.stock > 0

      return (
        matchesCategory &&
        matchesSearch &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesStock
      )
    })
    .sort((a, b) => {
      const priceA = a.sale_price_cents || a.price_cents
      const priceB = b.sale_price_cents || b.price_cents

      if (sortBy === 'price-asc') return priceA - priceB
      if (sortBy === 'price-desc') return priceB - priceA
      if (sortBy === 'date-desc') {
        return (
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
      }
      return 0
    })

  const displayedProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredProducts.length
  const comparedProducts = products.filter((product) => compareIds.includes(product.id))

  const handleCompareToggle = (productId: string) => {
    setCompareIds((current) => {
      if (current.includes(productId)) return current.filter((id) => id !== productId)
      if (current.length >= 3) return current
      return [...current, productId]
    })
  }

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + BATCH_SIZE)
  }

  return (
    <div className="space-y-8 lg:space-y-10">
      {/* Page Title Header */}
      <div className="motion-rise relative flex flex-col gap-4 overflow-hidden border-b border-white/[0.09] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="pointer-events-none absolute -right-8 -top-20 h-48 w-48 rounded-full bg-[#b6a17d]/[0.08] blur-3xl" />
        <div className="relative max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c2b18f]">
            <span className="h-px w-7 bg-[#8f8065]" />
            {t.catalog}
          </span>
          <h1 className="fluid-heading letterspace-hover font-serif font-medium tracking-tight text-[#eeeae2]">
            Le catalogue
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400 sm:text-base sm:tracking-wide">
            Parcourez les produits actuellement proposés.
          </p>
        </div>
        {!loading && !loadError && (
          <p className="relative shrink-0 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm text-zinc-400 shadow-sm backdrop-blur">
            <span className="font-semibold text-zinc-200">{filteredProducts.length}</span>{' '}
            {filteredProducts.length === 1 ? 'produit' : 'produits'}
          </p>
        )}
      </div>

      {/* Main Filter Control & Faceted Navigation Section */}
      <div className="motion-rise space-y-5 rounded-2xl border border-white/[0.09] bg-[#222321]/90 p-4 shadow-[0_14px_40px_-32px_rgba(0,0,0,0.8)] backdrop-blur-sm sm:p-5" style={{ animationDelay: '90ms' }}>
        {/* Row 1: Search bar, Result counter, Sort dropdown, and Reset */}
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-[#191a19] py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-[#8f8065] focus:outline-none focus:ring-2 focus:ring-[#b6a17d]/15"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Densité de la grille"
              className="flex items-center rounded-xl border border-white/[0.1] bg-[#252623] p-1"
            >
              <button
                type="button"
                aria-label="Grille confortable, deux colonnes"
                aria-pressed={gridMode === 'comfortable'}
                title="Deux colonnes"
                onClick={() => setGridMode('comfortable')}
                className={`rounded-lg p-2 transition-colors ${
                  gridMode === 'comfortable'
                    ? 'bg-[#66563d] text-white'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <Grid2X2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Grille compacte, quatre colonnes"
                aria-pressed={gridMode === 'compact'}
                title="Quatre colonnes"
                onClick={() => setGridMode('compact')}
                className={`rounded-lg p-2 transition-colors ${
                  gridMode === 'compact'
                    ? 'bg-[#66563d] text-white'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Faceted Filters Toggle Button */}
            <button
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className={`motion-link flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider ${
                filterDrawerOpen
                  ? 'border-[#66563d] bg-[#66563d] text-white shadow-md shadow-[#66563d]/15'
                  : 'border-white/[0.1] bg-[#252623] text-zinc-300 hover:border-[#8f8065]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  filterDrawerOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              aria-label="Trier les produits"
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="motion-link min-h-10 rounded-xl border border-white/[0.1] bg-[#252623] px-3 text-sm text-zinc-300 focus:border-[#8f8065] focus:outline-none focus:ring-2 focus:ring-[#b6a17d]/15"
            >
              <option value="date-desc">Nouveautés</option>
              <option value="price-asc">Prix : croissant</option>
              <option value="price-desc">Prix : décroissant</option>
            </select>

            {/* One-click Reset */}
            <button
              onClick={handleResetFilters}
              title="Réinitialiser tous les filtres"
              className="motion-link rounded-xl border border-white/[0.1] bg-[#252623] p-2.5 text-zinc-400 hover:border-[#8f8065] hover:text-white"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Category Pills */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 pt-1">
          {['Tous', ...categories.map((category) => category.slug)].map((categoryKey) => {
            const category = categories.find((item) => item.slug === categoryKey)
            const count = category
              ? products.filter((product) =>
                  product.category_id
                    ? product.category_id === category.id
                    : product.category === category.name
                ).length
              : products.length

            return (
            <button
              key={categoryKey}
              onClick={() => handleCategoryChange(category ? category.slug : 'Tous')}
              className={`motion-link flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium ${
                selectedCategory === categoryKey
                  ? 'border-[#66563d] bg-[#66563d] text-white shadow-md shadow-[#66563d]/15'
                  : 'border-white/[0.1] bg-[#252623] text-zinc-300 hover:border-[#8f8065] hover:text-white'
              }`}
            >
              <span>{category ? category.name : t.allProducts}</span>
              <span className={`text-xs ${selectedCategory === categoryKey ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {count}
              </span>
            </button>
            )
          })}
        </div>

        {/* Expandable Advanced Faceted Filter Sidebar / Panel */}
        {filterDrawerOpen && (
          <div className="pt-6 border-t border-white/[0.08] space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 gap-6 rounded-xl border border-white/[0.08] bg-[#1b1c1b] p-5 md:grid-cols-2">
              {/* Filter 1: Price Range */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                  Plage de Prix (€)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => handleMinPriceChange(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.1] bg-[#252623] px-3 py-2.5 text-sm text-zinc-200 focus:border-[#8f8065] focus:outline-none"
                  />
                  <span className="text-zinc-400 font-bold">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.1] bg-[#252623] px-3 py-2.5 text-sm text-zinc-200 focus:border-[#8f8065] focus:outline-none"
                  />
                </div>
              </div>

              {/* Filter 2: Stock Availability */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                  Disponibilité
                </span>
                <button
                  onClick={handleInStockToggle}
                  className={`w-full py-2 px-4 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    inStockOnly
                      ? 'bg-[#665d4d] text-white border-[#665d4d]'
                      : 'bg-[#252623] text-zinc-300 border-white/[0.1] hover:border-[#8f8065]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {inStockOnly ? 'Produits en stock uniquement' : 'Tous les produits'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Grid & Infinite Scroll Batch Loading */}
      {loading ? (
        <ProductSkeleton count={6} />
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-red-900/60 bg-[#242321] p-8 text-center text-sm text-red-200">
          {loadError}
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center space-y-3 rounded-2xl border border-white/[0.09] bg-[#222321] p-8 text-center shadow-sm">
          <Layers className="w-10 h-10 text-zinc-500" />
          <p className="font-serif text-lg text-zinc-200">
            {products.length === 0
              ? 'Aucun produit disponible pour le moment.'
              : 'Aucun produit ne correspond à vos filtres.'}
          </p>
          {products.length === 0 && (
            <p className="max-w-md text-sm text-zinc-400">
              Les produits publiés par la boutique apparaîtront ici.
            </p>
          )}
          <button
            onClick={handleResetFilters}
            className="rounded-lg border border-white/[0.12] px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-[#8f8065] hover:bg-white/[0.04]"
          >
            Effacer les filtres
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {compareIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#8f8065]/30 bg-[#222321] px-4 py-3">
              <span className="text-sm text-zinc-300">
                {compareIds.length} article(s) sélectionné(s) pour comparaison
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={compareIds.length < 2}
                  onClick={() => setCompareOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#66563d] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#766446] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Scale className="h-4 w-4" aria-hidden="true" />
                  Comparer ({compareIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCompareIds([])}
                  aria-label="Effacer la sélection de comparaison"
                  className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          <div className={`grid gap-3 sm:gap-5 ${
            gridMode === 'comfortable'
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {displayedProducts.map((product, index) => (
              <CatalogProductCard
                key={product.id}
                product={product}
                formatPrice={formatPrice}
                tView={t.viewPiece}
                onCardClick={handleProductClick}
                onCardHover={() => router.prefetch(`/products/${product.id}`)}
                onQuickView={() => setQuickViewProduct(product)}
                variants={variantPreviews[product.id] || []}
                isComparing={compareIds.includes(product.id)}
                comparisonLimitReached={compareIds.length >= 3 && !compareIds.includes(product.id)}
                onCompare={() => handleCompareToggle(product.id)}
                animationDelay={`${Math.min(index, 7) * 65}ms`}
              />
            ))}
          </div>

          {/* Load More Batch Button / Infinite Scroll Trigger */}
          {hasMore && (
            <div className="text-center pt-8">
              <button
                onClick={handleLoadMore}
                className="motion-link inline-flex items-center gap-2 rounded-xl bg-[#66563d] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-[#66563d]/20 hover:bg-[#4f422f] group"
              >
                <span>Afficher plus de produits</span>
                <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
              </button>
              <p className="mt-2 text-xs text-zinc-600">
                {displayedProducts.length} sur {filteredProducts.length} produits
              </p>
            </div>
          )}
        </div>
      )}

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      {compareOpen && comparedProducts.length > 1 && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCompareOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-products-title"
            className="motion-rise max-h-[85dvh] w-full max-w-5xl overflow-auto rounded-2xl border border-white/10 bg-[#20211f] p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="compare-products-title" className="font-serif text-2xl text-zinc-100">
                Comparer les articles
              </h2>
              <button
                type="button"
                onClick={() => setCompareOpen(false)}
                aria-label="Fermer la comparaison"
                className="rounded-full p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="w-28 border-b border-white/10 p-3 text-xs uppercase tracking-wider text-zinc-500">
                      Article
                    </th>
                    {comparedProducts.map((product) => (
                      <th key={product.id} className="border-b border-white/10 p-3 align-top">
                        <div className="relative mb-3 aspect-[4/5] max-w-48 overflow-hidden rounded-lg bg-[#2d2e2b]">
                          {product.images?.[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              fill
                              sizes="192px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <Link
                          href={`/products/${product.id}`}
                          onClick={() => setCompareOpen(false)}
                          className="font-serif text-base text-zinc-100 hover:text-[#c2b18f]"
                        >
                          {product.title}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCompareToggle(product.id)}
                          className="mt-2 block text-xs text-zinc-500 hover:text-zinc-200"
                        >
                          Retirer
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th className="border-b border-white/[0.07] p-3 text-xs text-zinc-500">Prix</th>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="border-b border-white/[0.07] p-3 font-semibold text-[#c2b18f]">
                        {formatPrice(product.sale_price_cents || product.price_cents)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="border-b border-white/[0.07] p-3 text-xs text-zinc-500">Catégorie</th>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="border-b border-white/[0.07] p-3 text-zinc-300">
                        {product.category}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="border-b border-white/[0.07] p-3 text-xs text-zinc-500">Stock</th>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="border-b border-white/[0.07] p-3 text-zinc-300">
                        {product.stock > 0 ? `${product.stock} disponible(s)` : 'Épuisé'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="p-3 align-top text-xs text-zinc-500">Description</th>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="p-3 align-top leading-relaxed text-zinc-400">
                        {product.description}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function CatalogProductCard({
  product,
  formatPrice,
  tView,
  onCardClick,
  onCardHover,
  onQuickView,
  variants,
  isComparing,
  comparisonLimitReached,
  onCompare,
  animationDelay,
}: {
  product: Product
  formatPrice: (p: number) => string
  tView: string
  onCardClick: () => void
  onCardHover: () => void
  onQuickView: () => void
  variants: CatalogVariantPreview[]
  isComparing: boolean
  comparisonLimitReached: boolean
  onCompare: () => void
  animationDelay: string
}) {
  const [hovered, setHovered] = useState(false)
  const primaryImg = product.images[0]
  const secondaryImg = product.images[1] || primaryImg

  const hasSale = !!product.sale_price_cents

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ animationDelay }}
      className="motion-card group flex flex-col overflow-hidden rounded-xl border border-white/[0.09] bg-[#242523] hover:border-[#8f8065]/60"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#2d2e2b]">
        <Link
          href={`/products/${product.id}`}
          onClick={onCardClick}
          onMouseEnter={onCardHover}
          aria-label={`${tView} : ${product.title}`}
          className="absolute inset-0 z-[1]"
        >
        {primaryImg && (
          <>
            <Image
              src={primaryImg}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className={`object-cover transition-[opacity,transform] duration-700 ${hovered && secondaryImg !== primaryImg ? 'opacity-0' : 'opacity-100'}`}
            />
            {secondaryImg !== primaryImg && (
              <Image
                src={secondaryImg}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                aria-hidden="true"
                className={`object-cover transition-[opacity,transform] duration-700 ${hovered ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
          </>
        )}
        {!primaryImg && (
          <div className="flex h-full items-center justify-center text-zinc-400">
            <Layers className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
          <span className="rounded-full border border-white/10 bg-[#191a19]/90 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-300 shadow-sm backdrop-blur">
            {product.category}
          </span>
          {hasSale && (
            <span className="flex items-center gap-1 rounded-full bg-[#b6a17d] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[#191a19] shadow-sm">
              <Tag className="w-3 h-3" />
              Prix réduit
            </span>
          )}
        </div>
        {product.stock <= 0 && (
          <span className="absolute bottom-3 left-3 rounded-md bg-[#242523]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-200 shadow-sm">
            Épuisé
          </span>
        )}
        </Link>
        <button
          type="button"
          onClick={onQuickView}
          aria-label={`Aperçu rapide : ${product.title}`}
          className="absolute right-3 top-3 z-[3] inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#191a19]/85 text-zinc-200 shadow-lg backdrop-blur transition hover:border-[#b6a17d]/60 hover:text-[#d6c8aa]"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between space-y-3 p-3.5 sm:p-5">
        <Link
          href={`/products/${product.id}`}
          onClick={onCardClick}
          className="block"
        >
          <h2 className="letterspace-hover line-clamp-2 font-serif text-sm font-semibold leading-snug text-zinc-200 transition-colors group-hover:text-[#c2b18f] sm:text-lg">
            {product.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">
            {product.description}
          </p>
        </Link>

        {variants.length > 0 && (
          <div className="variant-preview flex max-h-0 flex-wrap items-center gap-1.5 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-12 group-hover:opacity-100 group-focus-within:max-h-12 group-focus-within:opacity-100">
            {variants.slice(0, 4).map((variant) => (
              <span
                key={variant.id}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] text-zinc-400"
              >
                {variant.attributes?.color || variant.attributes?.size || variant.title}
              </span>
            ))}
            {variants.length > 4 && (
              <span className="text-[9px] text-zinc-500">+{variants.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-white/[0.08] pt-3">
          <div>
            {hasSale ? (
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono text-[10px] text-zinc-500 line-through sm:text-xs">
                  {formatPrice(product.price_cents)}
                </span>
                <span className="font-serif text-sm font-semibold text-zinc-200 sm:text-lg">
                  {formatPrice(product.sale_price_cents!)}
                </span>
              </div>
            ) : (
              <span className="font-serif text-sm font-semibold text-zinc-200 sm:text-lg">
                {formatPrice(product.price_cents)}
              </span>
            )}
          </div>

          <button
            type="button"
            aria-pressed={isComparing}
            disabled={comparisonLimitReached}
            aria-label={`${isComparing ? 'Retirer de' : 'Ajouter à'} la comparaison : ${product.title}`}
            onClick={onCompare}
            className={`rounded-lg border p-2 transition ${
              isComparing
                ? 'border-[#8f8065]/70 bg-[#66563d]/40 text-[#d6c8aa]'
                : 'border-white/10 text-zinc-500 hover:border-[#8f8065]/60 hover:text-zinc-200'
            }`}
            title={comparisonLimitReached ? 'La comparaison est limitée à trois articles' : 'Comparer'}
          >
            <Scale className="h-4 w-4" aria-hidden="true" />
          </button>
          <Link
            href={`/products/${product.id}`}
            onClick={onCardClick}
            className="shrink-0 text-[10px] font-semibold text-zinc-400 transition-colors group-hover:text-[#c2b18f] sm:text-xs"
          >
            {tView} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
