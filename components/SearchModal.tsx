'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, History, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BLUR_DATA_URL } from '@/lib/constants'
import { CATEGORY_LABELS, formatDogPrice, type Dog } from '@/lib/dogs'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const SEARCH_HISTORY_KEY = 'maison_lm_recent_searches'

function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function formatEur(cents: number): string {
  return `${{(cents / 100).toFixed(2).replace('.', ',')}} €`
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const dogsLoadedRef = useRef(false)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Dog[]>([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [allDogs, setAllDogs] = useState<Dog[]>([])
  const [catalogError, setCatalogError] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    setTimeout(() => inputRef.current?.focus(), 100)
    document.body.style.overflow = 'hidden'

    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (saved) setHistory(JSON.parse(saved).slice(0, 5))
    } catch {
      // Ignore
    }

    async function loadDogs() {
      if (dogsLoadedRef.current) return
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('dogs')
          .select('*')
          .eq('is_published', true)
          .order('sort_order', { ascending: false })
        if (error) throw error
        setAllDogs((data || []) as Dog[])
        setCatalogError(false)
        dogsLoadedRef.current = true
      } catch (error) {
        console.error('Unable to load dogs for search:', error)
        setAllDogs([])
        setCatalogError(true)
      } finally {
        setLoading(false)
      }
    }
    void loadDogs()

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const terms = normalizeSearchText(query).trim().split(/\s+/).filter(Boolean)
    if (terms.length === 0) {
      setResults([])
      return
    }
    const filtered = allDogs.filter((dog) => {
      const searchableText = normalizeSearchText(
        `${dog.name} ${dog.breed || ''} ${dog.category} ${dog.description || ''}`
      )
      return terms.every((term) => searchableText.includes(term))
    })
    setResults(filtered)
  }, [query, allDogs])

  const saveSearchTerm = useCallback((term: string) => {
    if (!term.trim()) return
    try {
      setHistory((current) => {
        const updated = [term, ...current.filter((h) => h.toLowerCase() !== term.toLowerCase())].slice(0, 5)
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
        return updated
      })
    } catch {
      // Ignore
    }
  }, [])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    saveSearchTerm(trimmed)
    onClose()
    router.push(`/nos-chiens?q=${encodeURIComponent(trimmed)}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 px-4 pt-24 backdrop-blur-sm">
      <section className="w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-[#191a19] shadow-2xl">
        <form onSubmit={handleSearch} className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
          <Search className="h-5 w-5 text-zinc-500" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un chien par nom ou race…"
            aria-label="Rechercher un chien"
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <button type="button" onClick={onClose} aria-label="Fermer la recherche" className="text-zinc-500 hover:text-zinc-200">
            <X className="h-5 w-5" />
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {history.length > 0 && query.trim() === '' && (
            <div className="mb-3 space-y-2">
              <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Recherches récentes</span>
              {history.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/[0.04]"
                >
                  <History className="h-4 w-4 text-zinc-500" />
                  {term}
                </button>
              ))}
            </div>
          )}

          {query.trim() === '' ? (
            <p className="px-3 py-8 text-center text-xs font-light text-zinc-500">
              Saisissez un nom ou une race pour découvrir nos compagnons.
            </p>
          ) : loading ? (
            <p className="px-3 py-8 text-center text-xs text-zinc-500">Chargement…</p>
          ) : results.length === 0 ? (
            <div className="px-3 py-8 text-center text-zinc-400 space-y-2">
              <p className="font-serif text-sm">
                {catalogError ? 'La recherche ne peut pas charger les fiches.' : `Aucun compagnon pour « ${query} ».`}
              </p>
              <p className="text-xs font-light">Essayez un autre terme ou parcourez nos chiens.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {results.slice(0, 6).map((dog) => (
                <Link
                  key={dog.id}
                  data-testid="search-suggestion-item"
                  href={`/nos-chiens/${dog.slug}`}
                  onClick={() => {
                    saveSearchTerm(query)
                    onClose()
                  }}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.08] p-3 transition-colors hover:border-[#8f8065]/50 hover:bg-white/[0.02]"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                    {dog.images[0] ? (
                      <Image src={dog.images[0]} alt={dog.name} fill sizes="56px" placeholder="blur" blurDataURL={BLUR_DATA_URL} className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg text-zinc-600">🐾</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] uppercase tracking-[0.2em] font-bold text-[#b6a17d]">{CATEGORY_LABELS[dog.category]}</span>
                    <h4 className="truncate font-serif text-sm text-zinc-200">{dog.name}</h4>
                    <span className="text-xs text-[#c2b18f]">{formatDogPrice(dog.price_cents, dog.price_on_request, formatEur)}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-600" aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
