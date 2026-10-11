'use client'

import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function AdminRolesMatrixPage() {
  return (
    <div className="bg-[#FAF8F5] min-h-screen text-zinc-900 p-6 lg:p-12 space-y-8">
      <div className="border-b border-zinc-200 pb-6">
        <Link
          href="/admin/team"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-[#C5A059] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;Équipe
        </Link>
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-[#C5A059]" />
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-950">
            Rôles &amp; autorisations
          </h1>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="font-serif font-bold text-lg text-zinc-950">
          Gestion des autorisations non configurée
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Aucun rôle ni aucune permission n’est enregistré. Connectez une source persistante avant de configurer les accès.
        </p>
      </div>
    </div>
  )
}
