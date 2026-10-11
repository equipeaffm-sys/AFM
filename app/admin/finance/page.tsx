'use client'

import Link from 'next/link'
import { ArrowLeft, Percent, Receipt, TrendingUp } from 'lucide-react'

export default function AdminFinancePage() {
  return (
    <div className="bg-[#FAF8F5] min-h-screen text-zinc-900 p-6 lg:p-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-[#C5A059] transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-[#C5A059]" />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-950">Données financières</h1>
          </div>
          <p className="text-xs text-zinc-600">
            Les indicateurs financiers ne sont pas disponibles tant qu’aucune source de données n’est configurée.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/invoices"
            className="px-4 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-800 hover:bg-zinc-50 flex items-center gap-2"
          >
            <Receipt className="w-4 h-4 text-[#C5A059]" />
            Factures
          </Link>
          <Link
            href="/admin/finance/taxes"
            className="px-4 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-800 hover:bg-zinc-50 flex items-center gap-2"
          >
            <Percent className="w-4 h-4 text-[#C5A059]" />
            Règles fiscales
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        Aucune donnée financière disponible.
      </div>
    </div>
  )
}
