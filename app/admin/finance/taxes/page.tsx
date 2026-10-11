import Link from 'next/link'
import { ArrowLeft, Percent } from 'lucide-react'

export default function AdminFinanceTaxesPage() {
  return (
    <div className="bg-[#FAF8F5] min-h-screen text-zinc-900 p-6 lg:p-12 space-y-8">
      <div className="border-b border-zinc-200 pb-6">
        <Link
          href="/admin/finance"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-[#C5A059] transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux finances
        </Link>
        <div className="flex items-center gap-3">
          <Percent className="w-7 h-7 text-[#C5A059]" />
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-950">Configuration fiscale</h1>
        </div>
        <p className="text-xs text-zinc-600 mt-2">
          Aucun taux fiscal n’est configuré. Vérifiez les règles applicables à votre activité avant de les renseigner.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        Aucune règle fiscale disponible.
      </div>
    </div>
  )
}
