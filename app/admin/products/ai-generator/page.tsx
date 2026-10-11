import Link from 'next/link'
import { ArrowLeft, Bot } from 'lucide-react'

export default function AIProductGeneratorPage() {
  return (
    <div className="bg-[#FEFDF5] text-zinc-900 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 hover:text-[#C5A059] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au catalogue
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-[#C5A059]" />
            <h1 className="text-2xl font-serif font-bold text-zinc-950">Génération de fiches produit</h1>
          </div>
          <p className="mt-3 text-sm text-zinc-600">
            La génération assistée n’est pas configurée. Ajoutez les caractéristiques vérifiées d’un produit dans le formulaire du catalogue.
          </p>
        </div>
      </div>
    </div>
  )
}
