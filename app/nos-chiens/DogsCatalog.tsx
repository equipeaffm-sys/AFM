'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  CATEGORY_LABELS,
  DOG_CATEGORIES,
  DOG_STATUSES,
  STATUS_LABELS,
  formatAgeLabel,
  formatDogPrice,
  isDogCategory,
  isDogStatus,
  type Dog,
  type DogCategory,
  type DogStatus,
} from '@/lib/dogs'
import { BLUR_DATA_URL } from '@/lib/constants'
import { useCurrency } from '@/components/CurrencyContext'
import { useSavedProducts } from '@/context/SavedProductsContext'

type CategoryFilter = 'all' | DogCategory
type StatusFilter = 'all' | DogStatus

const STATUS_STYLES: Record<DogStatus, string> = {
  available: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
  reserved: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
  adopted: 'border-zinc-400/30 bg-zinc-500/15 text-zinc-300',
}

function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export default function DogsCatalog() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { formatPrice } = useCurrency()
  const { favoriteIds, toggleFavorite } = useSavedProducts()

  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const categoryParam = searchParams.get('category') || 'all'
  const statusParam = searchParams.get('status') || 'all'
  const queryParam = searchParams.get('q') || ''

  const [searchQuery, setSearchQuery] = useState(queryParam)
  const categoryFilter: CategoryFilter = isDogCategory(categoryParam) ? categoryParam : 'all'
  const statusFilter: StatusFilter = isDogStatus(statusParam) ? statusParam : 'all'

  const loadDogs = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      setDogs((data || []) as Dog[])
    } catch (error) {
      console.error('Unable to load dogs:', error)
      setLoadError('Impossible de charger les fiches pour le moment. Merci de réessayer plus tard.')
      setDogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDogs()
  }, [loadDogs])

  const setFilter = (key: 'category' | 'status', value: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (value === 'all') params.delete(key)
    else params.set(key, value)
    const queryString = params.toString()
    router.replace(queryString ? `/nos-chiens?${queryString}` : '/nos-chiens', { scroll: false })
  }

  const filteredDogs = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery.trim())
    return dogs.filter((dog) => {
      const matchesCategory = categoryFilter === 'all' || dog.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || dog.status === statusFilter
      const haystack = normalizeSearchText(
        [dog.name, dog.breed, dog.description].filter(Boolean).join(' ')
      )
      const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery)
      return matchesCategory && matchesStatus && matchesSearch
    })
  }, [dogs, categoryFilter, statusFilter, searchQuery])

  const hasDogs = dogs.length > 0
  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="mx-auto max-w-3xl text-center space-y-4">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b6a17d]">
          Notre élevage
        </span>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-[#e8e5de] sm:text-5xl">
          Nos chiots &amp; chiens
        </h1>
        <p className="text-sm font-light leading-relaxed text-zinc-400 sm:text-base">
          Chaque compagnon est élevé avec attention au sein de notre élevage familial. Les réservations
          se font après un échange pour garantir une adoption adaptée à chacun.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#242523]/70 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={categoryFilter === 'all'} onClick={() => setFilter('category', 'all')}>
              Tous
            </FilterChip>
            {DOG_CATEGORIES.map((category) => (
              <FilterChip
                key={category}
                active={categoryFilter === category}
                onClick={() => setFilter('category', category)}
              >
                {CATEGORY_LABELS[category]}s
              </FilterChip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={statusFilter === 'all'} onClick={() => setFilter('status', 'all')}>
              Tous les statuts
            </FilterChip>
            {DOG_STATUSES.map((status) => (
              <FilterChip
                key={status}
                active={statusFilter === status}
                onClick={() => setFilter('status', status)}
              >
                {STATUS_LABELS[status]}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher par nom ou race…"
            aria-label="Rechercher un chien"
            className="w-full rounded-xl border border-white/[0.1] bg-[#191a19] px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-[#8f8065] focus:outline-none"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p role="status" className="py-16 text-center text-sm text-zinc-500">
          Chargement de nos compagnons…
        </p>
      ) : loadError ? (
        <div role="alert" className="mx-auto max-w-lg rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-center text-sm text-red-200">
          {loadError}
        </div>
      ) : !hasDogs ? (
        <EmptyState />
      ) : filteredDogs.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">
          Aucun compagnon ne correspond à cette recherche pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDogs.map((dog) => (
            <DogCard
              key={dog.id}
              dog={dog}
              formatPrice={formatPrice}
              isFavorite={favoriteIds.includes(dog.id)}
              onToggleFavorite={() => toggleFavorite(dog.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-[#8f8065]/70 bg-[#66563d]/40 text-[#e5d9bf]'
          : 'border-white/10 text-zinc-400 hover:border-[#8f8065]/50 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-white/[0.08] bg-[#242523]/70 p-10 text-center space-y-5">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#8f8065]/40 bg-[#66563d]/20 text-2xl">
        🐾
      </span>
      <h2 className="font-serif text-2xl font-medium text-[#e8e5de]">
        Nos compagnons arrivent bientôt
      </h2>
      <p className="text-sm font-light leading-relaxed text-zinc-400">
        Aucun chien n’est disponible à la réservation pour le moment. Inscrivez-vous à notre liste
        d’attente ou contactez-nous : nous vous prévenons en priorité dès qu’une nouvelle portée ou qu’un
        compagnon adulte se présente.
      </p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/contact"
          className="rounded-xl bg-[#665d4d] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#eeeae2] transition-colors hover:bg-[#77705f]"
        >
          Liste d’attente &amp; contact
        </Link>
        <Link
          href="/a-propos"
          className="rounded-xl border border-white/[0.12] px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-[#8f8065] hover:text-[#d0c2a4]"
        >
          Notre élevage
        </Link>
      </div>
    </div>
  )
}

function DogCard({
  dog,
  formatPrice,
  isFavorite,
  onToggleFavorite,
}: {
  dog: Dog
  formatPrice: (cents: number) => string
  isFavorite: boolean
  onToggleFavorite: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const primaryImg = dog.images[0]
  const secondaryImg = dog.images[1] || primaryImg
  const ageLabel = formatAgeLabel(dog.birth_date)
  const priceLabel = formatDogPrice(dog.price_cents, dog.price_on_request, formatPrice)
  const canReserve = dog.status === 'available'

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#242523] transition-colors hover:border-[#8f8065]/60"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#2d2e2b]">
        {primaryImg ? (
          <>
            <Image
              src={primaryImg}
              alt={dog.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className={`object-cover transition-opacity duration-700 ${hovered && secondaryImg !== primaryImg ? 'opacity-0' : 'opacity-100'}`}
            />
            {secondaryImg !== primaryImg && (
              <Image
                src={secondaryImg}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                aria-hidden="true"
                className={`object-cover transition-opacity duration-700 ${hovered ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-zinc-600">🐾</div>
        )}

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <span className="rounded-full bg-[#191a19]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#c2b18f] backdrop-blur-md">
            {CATEGORY_LABELS[dog.category]}
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${STATUS_STYLES[dog.status]}`}>
            {STATUS_LABELS[dog.status]}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={isFavorite ? `Retirer ${dog.name} des favoris` : `Ajouter ${dog.name} aux favoris`}
          aria-pressed={isFavorite}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#191a19]/80 text-zinc-300 backdrop-blur-md transition-colors hover:text-[#c2b18f]"
        >
          <svg viewBox="0 0 24 24" className={`h-4 w-4 ${isFavorite ? 'fill-[#c2b18f] text-[#c2b18f]' : 'fill-none'}`} stroke="currentColor" strokeWidth="1.6">
            <path d="M12 20.5s-7.5-4.6-7.5-9.6a4.2 4.2 0 0 1 7.5-2.6 4.2 4.2 0 0 1 7.5 2.6c0 5-7.5 9.6-7.5 9.6z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-serif text-xl font-medium text-[#e8e5de] transition-colors group-hover:text-[#c2b18f]">
              {dog.name}
            </h3>
            {dog.sex && (
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                {dog.sex === 'male' ? 'Mâle' : 'Femelle'}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-light text-zinc-400">
            {[dog.breed, ageLabel].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
          <span className="font-serif text-sm font-semibold text-[#e8e5de]">{priceLabel}</span>
          {canReserve ? (
            <Link
              href={`/nos-chiens/${dog.slug}`}
              className="rounded-lg bg-[#66563d] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#eeeae2] transition-colors hover:bg-[#77705f]"
            >
              Réserver
            </Link>
          ) : (
            <Link
              href={`/nos-chiens/${dog.slug}`}
              className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-[#c2b18f]"
            >
              Voir la fiche →
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
