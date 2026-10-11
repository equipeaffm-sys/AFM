'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Link as LinkIcon,
  Copy,
  DollarSign,
  Award,
  ArrowLeft,
  CheckCircle2,
  Tag,
  CreditCard,
} from 'lucide-react'

export default function CreatorAffiliateDashboardPage() {
  const [promoCodeInput, setPromoCodeInput] = useState('LUCAS10')
  const [currentPromoCode, setCurrentPromoCode] = useState('LUCAS10')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const referralLink = `https://maison-lm.com?ref=${currentPromoCode.toLowerCase()}`

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    showToast('Lien d\'affiliation copié dans le presse-papier !')
  }

  const handleUpdateCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoCodeInput.trim()) return
    const cleanCode = promoCodeInput.trim().toUpperCase().replace(/\s+/g, '')
    setCurrentPromoCode(cleanCode)
    showToast(`Code promo personnalisé mis à jour : ${cleanCode}`)
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen text-zinc-900 p-6 lg:p-12 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0D0D0D] text-[#C5A059] px-6 py-4 rounded-xl shadow-2xl border border-[#C5A059] flex items-center gap-3 text-xs font-mono animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-[#C5A059] transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Site Vitrine
          </Link>
          <div className="flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-[#C5A059]" />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-950">
              Espace Ambassadeur &amp; Partenaire Influenceur L&amp;M
            </h1>
          </div>
          <p className="text-xs text-zinc-600 font-light">
            Générez votre lien d&apos;affiliation, personnalisez votre code promo et suivez vos commissions en temps réel.
          </p>
        </div>

        <div className="px-4 py-2 bg-amber-100 border border-amber-300 rounded-2xl text-xs font-bold font-serif text-amber-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-[#C5A059]" />
          Statut Partenaire : Ambassadeur Gold (10% Commission)
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Total Clics Générés</span>
          <div className="text-3xl font-serif font-bold text-zinc-950">1,420</div>
          <span className="text-[10px] text-emerald-700 font-bold block">+12.5% ce mois-ci</span>
        </div>

        <div className="p-6 bg-white border border-zinc-200 rounded-3xl space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Ventes Réalisées</span>
          <div className="text-3xl font-serif font-bold text-zinc-950">18</div>
          <span className="text-[10px] text-zinc-500 block">Taux de conversion : 1.27%</span>
        </div>

        <div className="p-6 bg-white border border-[#C5A059]/40 rounded-3xl space-y-1 shadow-xl ring-1 ring-[#C5A059]/30">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059]">Commissions Cumulées</span>
          <div className="text-3xl font-serif font-bold text-[#C5A059]">3,850.00 €</div>
          <span className="text-[10px] text-zinc-500 font-bold block">10% sur les ventes HT</span>
        </div>

        <div className="p-6 bg-white border border-zinc-200 rounded-3xl space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Solde Disponible / Retrait</span>
          <div className="text-3xl font-serif font-bold text-emerald-700">1,200.00 €</div>
          <span className="text-[10px] text-zinc-500 block">Prêt pour virement bancaire / PayPal</span>
        </div>
      </div>

      {/* Unique Link & Custom Code Customizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-zinc-100 pb-3 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-lg text-zinc-950">
              Votre Link &amp; Code Promo Partenaire
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                Lien d&apos;Affiliation Unique
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-zinc-200 rounded-xl font-mono text-zinc-900 font-bold focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-5 py-3 bg-[#0D0D0D] text-[#C5A059] font-bold uppercase tracking-wider rounded-xl hover:bg-[#C5A059] hover:text-[#0D0D0D] transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  Copier
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateCode} className="space-y-2 pt-2">
              <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                Code Promo Personnalisé (Offre -10% pour votre communauté)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-zinc-200 rounded-xl font-mono text-zinc-900 font-bold uppercase focus:outline-none focus:border-[#C5A059]"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#C5A059] text-white font-bold uppercase tracking-wider rounded-xl hover:bg-[#b08d48] transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Tag className="w-4 h-4" />
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Payout Request Card */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <CreditCard className="w-5 h-5 text-[#C5A059]" />
              <h2 className="font-serif font-bold text-lg text-zinc-950">
                Demande de Virement de Commissions
              </h2>
            </div>
            <p className="text-xs text-zinc-600 font-light leading-relaxed">
              Vos commissions sont validées 14 jours après la commande client. Solde actuel éligible au versement : <strong className="text-emerald-700 font-bold">1,200.00 €</strong>.
            </p>
          </div>

          <button
            onClick={() => showToast('Demande de virement envoyée à l\'administration ! Payout sous 48h.')}
            className="w-full py-4 bg-[#0D0D0D] text-[#C5A059] font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-[#C5A059] hover:text-[#0D0D0D] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Demander le Virement de 1,200.00 €
          </button>
        </div>
      </div>
    </div>
  )
}
