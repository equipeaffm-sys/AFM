import type { Metadata } from 'next'
import Link from 'next/link'
import { Baby, PawPrint, MessageCircleHeart, BookOpenCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Espace familles & accompagnement',
  description:
    'Conseils pratiques pour accueillir un chiot à la maison, favoriser une belle entente avec les enfants et bénéficier d’un suivi après l’adoption.',
}

const SECTIONS = [
  {
    icon: BookOpenCheck,
    title: 'Préparer l’arrivée',
    text: 'Panier, gamelles, litière d’apprentissage, jouets, premières visites chez le vétérinaire : nous vous guidons pas à pas pour un accueil serein.',
  },
  {
    icon: Baby,
    title: 'Avec les enfants',
    text: 'Nous partageons des conseils pour favoriser une relation respectueuse et sécurisée entre votre chien et les plus jeunes membres de la famille.',
  },
  {
    icon: PawPrint,
    title: 'Intégration & éducation',
    text: 'Propreté, solitude, socialisation, premières bases d’éducation : des repères bienveillants pour construire une relation de confiance.',
  },
  {
    icon: MessageCircleHeart,
    title: 'Un suivi attentif',
    text: 'Nous restons joignables pour répondre à vos questions et vous accompagner tout au long de la vie de votre compagnon.',
  },
]

export default function FamillesPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#252623_0%,_#1b1c1b_48%,_#191a19_100%)] px-4 py-16 text-[#e6e3dc] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-14">
        <header className="space-y-4 text-center">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b6a17d]">
            Espace familles
          </span>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#e8e5de] sm:text-5xl">
            Accompagnement &amp; conseils
          </h1>
          <p className="mx-auto max-w-2xl text-sm font-light leading-relaxed text-zinc-400 sm:text-base">
            Accueillir un chiot, c’est le début d’une belle histoire. Nous mettons à votre disposition des
            repères concrets pour que les premières semaines se déroulent sereinement.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <div
              key={section.title}
              className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#242523]/70 p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#66563d]/20 text-[#c2b18f]">
                <section.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="font-serif text-lg text-[#e8e5de]">{section.title}</h2>
              <p className="text-sm font-light leading-relaxed text-zinc-400">{section.text}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/[0.08] bg-[#242523]/70 p-8 text-center space-y-4">
          <h2 className="font-serif text-2xl text-[#e8e5de]">Une question avant de vous lancer ?</h2>
          <p className="mx-auto max-w-xl text-sm font-light leading-relaxed text-zinc-400">
            Nous échangeons volontiers sur votre projet d’adoption, votre rythme de vie et vos attentes.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="rounded-xl bg-[#665d4d] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#eeeae2] transition-colors hover:bg-[#77705f]"
            >
              Nous écrire
            </Link>
            <Link
              href="/faq"
              className="rounded-xl border border-white/[0.12] px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-[#8f8065] hover:text-[#d0c2a4]"
            >
              Consulter la FAQ
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
