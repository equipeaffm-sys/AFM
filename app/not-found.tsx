import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 bg-zinc-950">
      <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center space-y-6">
        <span className="font-serif text-6xl font-bold text-[#c2b18f]">404</span>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-medium">Page Introuvable</span>
          <h1 className="text-2xl font-serif font-bold text-zinc-100">
            Pièce ou Page Absente
          </h1>
          <p className="text-zinc-400 text-xs font-light leading-relaxed">
            La page que vous recherchez n&apos;existe pas ou a été déplacée dans les archives de la Maison.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-lg bg-[#665d4d] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-100 shadow-lg transition-all hover:bg-[#756a56]"
          >
            <ShoppingBag className="w-4 h-4" />
            Voir le catalogue
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-300 transition-all hover:border-[#8f8065] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Retourner à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
