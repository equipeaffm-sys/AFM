'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, History, ArrowRight, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Product, BLUR_DATA_URL } from '@/lib/constants'
import { useCurrency } from './CurrencyContext'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const SEARCH_HISTORY_KEY = 'maison_lm_recent_searches'

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const { formatPrice } = useCurrency()
  const inputRef = useRef<HTMLInputElement>(null)
  const catalogLoadedRef = useRef(false)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [catalogError, setCatalogError] = useState(false)

  // Load products & search history on mount/open
  useEffect(() => {
    if (!isOpen) return

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)

    // Lock body scroll
    document.body.style.overflow = 'hidden'

    // Load recent search history from localStorage
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (saved) {
        setHistory(JSON.parse(saved).slice(0, 5))
      }
    } catch {
      // Ignore
    }

    async function loadCatalog() {
      if (catalogLoadedRef.current) return
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setAllProducts(data || [])
        setCatalogError(false)
        catalogLoadedRef.current = true
      } catch (error) {
        console.error('Unable to load products for search:', error)
        setAllProducts([])
        setCatalogError(true)
      } finally {
        setLoading(false)
      }
    }
    void loadCatalog()

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Search the already-loaded catalogue synchronously as the visitor types.
  useEffect(() => {
    const terms = normalizeSearchText(query).trim().split(/\s+/).filter(Boolean)
    if (terms.length === 0) {
      setResults([])
      return
    }

    const filtered = allProducts.filter((product) => {
      const searchableText = normalizeSearchText(
        `${product.title} ${product.category} ${product.description || ''}`
      )
      return terms.every((term) => searchableText.includes(term))
    })

    setResults(filtered)
  }, [query, allProducts])

  // Save term to search history
  const saveSearchTerm = useCallback((term: string) => {
    if (!term.trim()) return
    try {
      const existing = history.filter((h) => h.toLowerCase() !== term.toLowerCase())
      const updated = [term, ...existing].slice(0, 5)
      setHistory(updated)
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
    } catch {
      // Ignore
    }
  }, [history])

  const handleSelectTerm = (term: string) => {
    setQuery(term)
    saveSearchTerm(term)
  }

  const handleRemoveHistoryItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation()
    const updated = history.filter((h) => h !== item)
    setHistory(updated)
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
    } catch {
      // Ignore
    }
  }

  const handleFullCatalogSearch = () => {
    if (query.trim()) {
      saveSearchTerm(query.trim())
      onClose()
      router.push(`/products?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter') {
      handleFullCatalogSearch()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-md sm:p-6"
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Recherche dans le catalogue"
        className="motion-rise flex max-h-[min(760px,calc(100dvh-2rem))] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-[#20211f] shadow-[0_30px_100px_-30px_rgba(0,0,0,0.9)] sm:max-h-[min(760px,calc(100dvh-3rem))]"
      >
        <div className="w-full border-b border-white/[0.08] bg-[#20211f] px-4 py-5 shadow-2xl sm:px-7">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Search className="w-6 h-6 text-[#b6a17d] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un article ou une catégorie…"
            aria-label="Rechercher un article ou une catégorie"
            className="flex-1 bg-transparent text-lg sm:text-2xl font-serif text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors"
              title="Effacer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 rounded-full transition-colors ml-2"
            title="Fermer la recherche"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        </div>

      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-7">
        {/* State A: Empty Query -> History & Suggestions */}
        {!query && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-zinc-200">
            {/* Recent Search History */}
            {history.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#c2b18f]">
                  <History className="w-4 h-4" />
                  Recherches récentes
                </div>
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item}
                      onClick={() => handleSelectTerm(item)}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] cursor-pointer transition-all group"
                    >
                      <span className="text-sm text-zinc-300 group-hover:text-[#c2b18f]">
                        {item}
                      </span>
                      <X
                        className="w-4 h-4 text-zinc-500 hover:text-red-400"
                        onClick={(e) => handleRemoveHistoryItem(e, item)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-start rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-relaxed text-zinc-400">
              Recherchez parmi les articles et les catégories actuellement publiés dans la boutique.
            </div>
          </div>
        )}

        {/* State B: Typing -> Debounced Search Live Results */}
        {query && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#c2b18f]">
                {loading
                  ? 'Recherche en cours...'
                  : `${results.length} création(s) trouvée(s)`}
              </span>
              {results.length > 0 && (
                <button
                  onClick={handleFullCatalogSearch}
                  className="text-xs text-zinc-300 hover:text-[#C5A059] flex items-center gap-1 font-semibold uppercase tracking-wider"
                >
                  Voir tous les résultats ({results.length})
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {loading ? (
              <div role="status" className="py-12 text-center text-sm text-zinc-400">
                Chargement du catalogue…
              </div>
            ) : results.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 space-y-3">
                <p className="font-serif text-lg">
                  {catalogError
                    ? 'La recherche ne peut pas charger le catalogue.'
                    : `Aucun article ne correspond à « ${query} ».`}
                </p>
                <p className="text-xs font-light">
                  Essayez un autre terme ou parcourez le catalogue.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.slice(0, 6).map((product) => {
                  const hasSale = !!product.sale_price_cents
                  const activePrice = product.sale_price_cents || product.price_cents

                  return (
                    <Link
                      key={product.id}
                      data-testid="search-suggestion-item"
                      href={`/products/${product.id}`}
                      onClick={() => {
                        saveSearchTerm(query)
                        onClose()
                      }}
                      className="flex items-center gap-4 p-3 bg-[#20211f] hover:bg-[#292a27] border border-white/[0.08] hover:border-[#8f8065]/50 rounded-2xl transition-all duration-300 group"
                    >
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                        {product.images[0] && (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            sizes="80px"
                            placeholder="blur"
                            blurDataURL={BLUR_DATA_URL}
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#b6a17d] block truncate">
                          {product.category}
                        </span>
                        <h4 className="font-serif text-sm font-bold text-zinc-200 truncate group-hover:text-[#d0c2a4] transition-colors">
                          {product.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-serif font-semibold text-[#c2b18f]">
                            {formatPrice(activePrice)}
                          </span>
                          {hasSale && (
                            <span className="px-1.5 py-0.5 bg-[#b6a17d]/15 text-[#c2b18f] text-[8px] uppercase tracking-wider font-bold rounded flex items-center gap-0.5">
                              <Tag className="w-2.5 h-2.5" /> Offre
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
      </section>
    </div>
  )
}

function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
