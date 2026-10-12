'use client'

import type { Metadata } from 'next'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Questions fréquentes',
  description:
    'Garanties, transport sécurisé et processus de réservation : les réponses aux questions les plus courantes avant d’accueillir un compagnon.',
}

interface QA {
  question: string
  answer: string
}

const FAQ_ITEMS: QA[] = [
  {
    question: 'Comment se déroule une réservation ?',
    answer:
      'Tout commence par un échange. Vous nous contactez via la fiche du compagnon qui vous intéresse ou via notre formulaire de contact. Nous discutons de votre projet, de votre mode de vie et de vos attentes, puis nous convenons ensemble des modalités. Aucune réservation n’est validée sans ce premier contact.',
  },
  {
    question: 'Proposez-vous plusieurs races ?',
    answer:
      'Notre sélection évolue au fil des portées. Consultez la page « Nos chiots & chiens » pour découvrir les compagnons actuellement disponibles et leurs caractéristiques. Si vous ne trouvez pas la race recherchée, écrivez-nous : nous vous informons dès qu’un compagnon correspondant se présente.',
  },
  {
    question: 'Comment est assuré le transport de mon chien ?',
    answer:
      'Le bien-être de l’animal est notre priorité. Selon la distance et la destination, nous vous accompagnons pour organiser un transport sécurisé et conforme, ou vous accueillons sur place pour la remise en main propre. Les conditions exactes sont définées lors de notre échange.',
  },
  {
    question: 'Quelles garanties offrez-vous aux familles ?',
    answer:
      'Chaque animal est identifié, suivi vétérinairement et remis avec les documents et les conseils nécessaires. Les conditions précises et les engagements réciproques vous sont présentés par écrit avant toute validation, afin que tout soit clair pour chacun.',
  },
  {
    question: 'Puis-je rencontrer le chiot avant de me décider ?',
    answer:
      'Dès que possible, oui. Nous encourageons vivement la rencontre avant l’adoption : elle permet de vérifier que le courant passe et de répondre à vos questions sur place. Les modalités de visite sont organisées lors de notre prise de contact.',
  },
  {
    question: 'Que se passe-t-il après l’adoption ?',
    answer:
      'Nous restons à vos côtés. Vous bénéficiez de nos conseils pour l’intégration, l’éducation et le suivi, et nous restons joignables pour vous accompagner tout au long de la vie de votre compagnon.',
  },
]

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#252623_0%,_#1b1c1b_48%,_#191a19_100%)] px-4 py-16 text-[#e6e3dc] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-4 text-center">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b6a17d]">
            Aide
          </span>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#e8e5de] sm:text-5xl">
            Questions fréquentes
          </h1>
          <p className="mx-auto max-w-2xl text-sm font-light leading-relaxed text-zinc-400 sm:text-base">
            Garanties, transport sécurisé et processus de réservation : l’essentiel pour préparer votre
            projet en toute sérénité.
          </p>
        </header>

        <div className="divide-y divide-white/[0.08] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#242523]/70">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <span className="font-serif text-base text-[#e8e5de] sm:text-lg">{item.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#b6a17d] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm font-light leading-relaxed text-zinc-400">
                    {item.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="rounded-3xl border border-[#8f8065]/25 bg-[#66563d]/10 p-8 text-center space-y-4">
          <h2 className="font-serif text-xl text-[#e8e5de]">Votre question n’est pas ici ?</h2>
          <p className="mx-auto max-w-lg text-sm font-light text-zinc-400">
            Écrivez-nous, nous serons ravis d’échanger avec vous sur votre projet d’adoption.
          </p>
          <Link
            href="/contact"
            className="inline-block rounded-xl bg-[#665d4d] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#eeeae2] transition-colors hover:bg-[#77705f]"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    </main>
  )
}
