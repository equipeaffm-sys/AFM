'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Heart, ShieldCheck, Stethoscope, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BLUR_DATA_URL } from '@/lib/constants'
import {
  CATEGORY_LABELS,
  formatAgeLabel,
  formatDogPrice,
  type Dog,
} from '@/lib/dogs'

const STANDARDS = [
  {
    icon: Heart,
    title: 'Ã‰levage familial',
    text: 'Nos chiens grandissent au cÅ“ur de la famille, sociabilisÃ©s avec soin dÃ¨s leurs premiÃ¨res semaines.',
  },
  {
    icon: ShieldCheck,
    title: 'SÃ©lection rigoureuse',
    text: 'Des reproducteurs choisis pour leur santÃ©, leur Ã©quilibre et leur conformitÃ© au standard de la race.',
  },
  {
    icon: Stethoscope,
    title: 'Suivi vÃ©tÃ©rinaire',
    text: 'Identification, primovaccinations et suivi sanitaire avant le dÃ©part vers sa nouvelle famille.',
  },
]

function formatEur(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} â‚¬`
}

export default function HomePage() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDogs() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('dogs')
          .select('*')
          .eq('is_published', true)
          .eq('status', 'available')
          .order('is_featured', { ascending: false })
          .order('sort_order', { ascending: false })
          .limit(3)
        if (error) throw error
        setDogs((data || []) as Dog[])
      } catch (error) {
        console.error('Unable to load available dogs:', error)
        setDogs([])
      } finally {
        setLoading(false)
      }
    }
    loadDogs()
  }, [])

  return (
    <div className="min-h-screen bg-[#191a19] text-[#e6e3dc]">
      {/* Hero */}
      <section className="relative isolate flex min-h-[560px] h-[78svh] max-h-[760px] items-center overflow-hidden bg-[#292720]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_60%_20%,_#3a3527_0%,_#232420_55%,_#191a19_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(#c2b18f_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-20 text-center sm:px-10">
          <div className="motion-rise inline-flex items-center gap-2.5 border border-white/20 bg-black/20 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-white/90 backdrop-blur-sm sm:text-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#c2b18f]" />
            Ã‰levage de chiens de race
          </div>
          <h1 className="mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight text-white sm:text-6xl">
            Un compagnon
            <span className="mt-2 block font-normal italic text-[#c2b18f]">dâ€™exception vous attend
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/85 sm:text-base sm:leading-8">
            Nous Ã©levons avec passion des chiots et accompagnons les chiens adultes vers de nouveaux
            foyers. Chaque adoption est prÃ©parÃ©e avec soin, dans le respect de lâ€™animal et de votre
            famille.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/nos-chiens"
              className="motion-link button-sheen group inline-flex min-h-12 items-center justify-center gap-3 bg-[#ddd7ca] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-900 transition-colors duration-300 hover:bg-[#c8bea9]"
            >
              DÃ©couvrir nos compagnons
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="motion-link button-sheen inline-flex min-h-12 items-center justify-center border border-white/30 bg-black/10 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:border-white/60 hover:bg-white/[0.08]"
            >
              Liste dâ€™attente &amp; contact
            </Link>
          </div>
        </div>
      </section>
      {/* Available companions */}
      <section className="border-t border-white/[0.07] bg-[#1d1e1c] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b6a17d]">Disponibles</span>
              <h2 className="font-serif text-2xl font-medium text-[#e8e5de] sm:text-3xl">Compagnons Ã  accueillir</h2>
            </div>
            <Link
              href="/nos-chiens"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#c2b18f] transition-colors hover:text-[#e8e5de]"
            >
              Voir tous nos chiens <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl border border-white/[0.08] bg-[#242523]" />
              ))}
            </div>
          ) : dogs.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-white/[0.08] bg-[#242523]/70 p-10 text-center">
              <p className="text-sm font-light text-zinc-400">
                Aucun compagnon nâ€™est disponible pour lâ€™instant.{' '}
                <Link href="/contact" className="text-[#c2b18f] underline underline-offset-2">
                  Inscrivez-vous Ã  la liste dâ€™attente
                </Link>{' '}
                pour Ãªtre prÃ©venu des prochaines portÃ©es.
              </p>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {dogs.map((dog) => {
                const image = dog.images?.[0]
                const age = formatAgeLabel(dog.birth_date)
                return (
                  <Link
                    key={dog.id}
                    href={`/nos-chiens/${dog.slug}`}
                    className="group overflow-hidden rounded-2xl border border-white/[0.09] bg-[#242523] transition-colors hover:border-[#8f8065]/60"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#2d2e2b]">
                      {image ? (
                        <Image
                          src={image}
                          alt={dog.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl text-zinc-600">ðŸ¾</div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-[#191a19]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#c2b18f] backdrop-blur-md">
                        {CATEGORY_LABELS[dog.category]}
                      </span>
                    </div>
                    <div className="space-y-1 p-5">
                      <h3 className="font-serif text-lg text-[#e8e5de] transition-colors group-hover:text-[#c2b18f]">{dog.name}</h3>
                      <p className="text-xs font-light text-zinc-400">{[dog.breed, age].filter(Boolean).join(' Â· ') || 'Notre Ã©levage'}</p>
                      <p className="pt-2 font-serif text-sm text-[#c2b18f]">
                        {formatDogPrice(dog.price_cents, dog.price_on_request, formatEur)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
      {/* Standards */}
      <section className="border-t border-white/[0.07] bg-[#20211f] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b6a17d]">Nos standards</span>
            <h2 className="font-serif text-2xl font-medium text-[#e8e5de] sm:text-3xl">
              Lâ€™exigence au service du bien-Ãªtre animal
            </h2>
            <p className="text-sm font-light leading-relaxed text-zinc-400">
              Chaque dÃ©part est prÃ©parÃ© avec attention. Nous privilÃ©gions la qualitÃ© de la relation Ã  la
              quantitÃ©, pour des adoptions durables et Ã©panouies.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {STANDARDS.map((standard) => (
              <div key={standard.title} className="space-y-4 rounded-2xl bg-[#262724] p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#b6a17d]/25 bg-[#b6a17d]/10 text-[#b6a17d]">
                  <standard.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-serif text-lg font-medium text-[#e8e5de]">{standard.title}</h3>
                <p className="text-xs leading-relaxed font-light text-zinc-400">{standard.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/a-propos"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#c2b18f] transition-colors hover:text-[#e8e5de]"
            >
              DÃ©couvrir notre Ã©levage <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
