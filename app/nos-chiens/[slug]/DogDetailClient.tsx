'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, PawPrint, Check } from 'lucide-react'
import {
  CATEGORY_LABELS,
  SEX_LABELS,
  STATUS_LABELS,
  formatAgeLabel,
  formatBirthDate,
  formatDogPrice,
  type Dog,
} from '@/lib/dogs'
import { BLUR_DATA_URL } from '@/lib/constants'
import { useCurrency } from '@/components/CurrencyContext'
import ReservationForm from './ReservationForm'

const STATUS_STYLES: Record<Dog['status'], string> = {
  available: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
  reserved: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
  adopted: 'border-zinc-400/30 bg-zinc-500/15 text-zinc-300',
}

export default function DogDetailClient({ dog }: { dog: Dog }) {
  const { formatPrice } = useCurrency()
  const [activeImage, setActiveImage] = useState(0)

  const images = useMemo(() => dog.images ?? [], [dog.images])
  const ageLabel = formatAgeLabel(dog.birth_date)
  const birthLabel = formatBirthDate(dog.birth_date)
  const priceLabel = formatDogPrice(dog.price_cents, dog.price_on_request, formatPrice)

  const facts: { label: string; value: string }[] = []
  facts.push({ label: 'Race', value: dog.breed || 'À préciser' })
  facts.push({ label: 'Sexe', value: dog.sex ? SEX_LABELS[dog.sex] : 'À préciser' })
  if (birthLabel) facts.push({ label: 'Né(e) le', value: birthLabel })
  if (ageLabel) facts.push({ label: 'Âge', value: ageLabel })
  if (dog.pedigree) facts.push({ label: 'Pedigree / Lignée', value: dog.pedigree })
  if (dog.health_tests) facts.push({ label: 'Tests de santé', value: dog.health_tests })

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#252623_0%,_#1b1c1b_48%,_#191a19_100%)] px-4 py-10 text-[#e6e3dc] sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link
          href="/nos-chiens"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-[#c2b18f]"
        >
          <ArrowLeft className="h-4 w-4" /> Nos chiots &amp; chiens
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#2d2e2b]">
              {images.length > 0 ? (
                <Image
                  src={images[Math.min(activeImage, images.length - 1)]}
                  alt={dog.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl text-zinc-600">🐾</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.slice(0, 10).map((url, index) => (
                  <button
                    key={url + index}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Voir l’image ${index + 1}`}
                    aria-pressed={activeImage === index}
                    className={`relative aspect-square overflow-hidden rounded-xl border transition-colors ${
                      activeImage === index ? 'border-[#8f8065]' : 'border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <Image src={url} alt="" fill sizes="80px" placeholder="blur" blurDataURL={BLUR_DATA_URL} className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            {dog.video_url && (
              <a
                href={dog.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#8f8065] hover:text-[#d0c2a4]"
              >
                <PawPrint className="h-4 w-4" /> Voir la vidéo
              </a>
            )}
          </div>
          {/* Info */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#191a19]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#c2b18f]">
                  {CATEGORY_LABELS[dog.category]}
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${STATUS_STYLES[dog.status]}`}>
                  {STATUS_LABELS[dog.status]}
                </span>
              </div>
              <h1 className="font-serif text-3xl font-medium text-[#e8e5de] sm:text-4xl">{dog.name}</h1>
              <p className="font-serif text-xl text-[#c2b18f]">{priceLabel}</p>
            </div>

            {dog.description && (
              <p className="text-sm font-light leading-relaxed text-zinc-300">{dog.description}</p>
            )}

            {/* Facts */}
            <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-white/[0.08] bg-[#242523]/70 p-5 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label} className="space-y-0.5">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{fact.label}</dt>
                  <dd className="text-sm text-zinc-200">{fact.value}</dd>
                </div>
              ))}
            </dl>

            {dog.characteristics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dog.characteristics.map((trait) => (
                  <span key={trait} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-zinc-300">
                    {trait}
                  </span>
                ))}
              </div>
            )}

            {dog.ideal_environment && (
              <div className="rounded-2xl border border-[#8f8065]/25 bg-[#66563d]/10 p-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#c2b18f]">Environnement idéal</h2>
                <p className="mt-2 text-sm font-light leading-relaxed text-zinc-300">{dog.ideal_environment}</p>
              </div>
            )}

            {dog.status === 'available' ? (
              <ReservationForm dogId={dog.id} dogName={dog.name} />
            ) : (
              <div className="rounded-2xl border border-white/[0.1] bg-[#242523]/70 p-6 text-center">
                <p className="flex items-center justify-center gap-2 text-sm text-zinc-300">
                  <Check className="h-4 w-4 text-[#c2b18f]" />
                  {dog.name} n’est plus disponible à la réservation.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-block rounded-xl border border-white/[0.12] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-[#8f8065] hover:text-[#d0c2a4]"
                >
                  Être informé des prochaines portées
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
