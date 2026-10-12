import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart, ShieldCheck, Home, Stethoscope } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Notre élevage & nos engagements',
  description:
    'Découvrez notre démarche d’élevage, notre sélection rigoureuse et les garanties offertes aux familles qui accueillent un compagnon.',
}

const PILLARS = [
  {
    icon: Heart,
    title: 'Élevage familial',
    text: 'Nos chiens font partie de la famille et sont sociabilisés dès leurs premières semaines dans un environnement chaleureux et stimulant.',
  },
  {
    icon: ShieldCheck,
    title: 'Sélection rigoureuse',
    text: 'Nos reproducteurs sont choisis avec soin pour leur santé, leur tempérament et leur conformité, afin de proposer des compagnons équilibrés.',
  },
  {
    icon: Stethoscope,
    title: 'Suivi vétérinaire',
    text: 'Chaque animal bénéficie d’un suivi sanitaire, d’une identification et de primovaccinations avant de rejoindre sa nouvelle famille.',
  },
  {
    icon: Home,
    title: 'Accompagnement',
    text: 'Nous restons à vos côtés après l’adoption : conseils, suivi et disponibilité pour vous aider à chaque étape de la vie de votre chien.',
  },
]

export default function AProposPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#252623_0%,_#1b1c1b_48%,_#191a19_100%)] px-4 py-16 text-[#e6e3dc] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-14">
        <header className="space-y-4 text-center">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b6a17d]">
            Le concept
          </span>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#e8e5de] sm:text-5xl">
            Notre élevage &amp; nos engagements
          </h1>
          <p className="mx-auto max-w-2xl text-sm font-light leading-relaxed text-zinc-400 sm:text-base">
            Nous accompagnons les familles dans l’accueil d’un compagnon d’exception, avec exigence,
            bienveillance et transparence. Chaque départ est préparé pour que la rencontre se fasse dans
            les meilleures conditions, pour le chien comme pour vous.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#242523]/70 p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#66563d]/20 text-[#c2b18f]">
                <pillar.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="font-serif text-lg text-[#e8e5de]">{pillar.title}</h2>
              <p className="text-sm font-light leading-relaxed text-zinc-400">{pillar.text}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-[#8f8065]/25 bg-[#66563d]/10 p-8 text-center space-y-4">
          <h2 className="font-serif text-2xl text-[#e8e5de]">Envie d’en savoir plus ?</h2>
          <p className="mx-auto max-w-xl text-sm font-light leading-relaxed text-zinc-400">
            Nous prenons le temps d’échanger avec chaque famille avant une réservation. Écrivez-nous ou
            consultez les compagnons disponibles.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/nos-chiens"
              className="rounded-xl bg-[#665d4d] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#eeeae2] transition-colors hover:bg-[#77705f]"
            >
              Voir nos compagnons
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-white/[0.12] px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-[#8f8065] hover:text-[#d0c2a4]"
            >
              Nous contacter
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
