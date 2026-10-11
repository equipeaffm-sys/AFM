import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CustomerReferralPage() {
  return (
    <main className="min-h-screen bg-[#191a19] p-6 text-zinc-100 lg:p-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-[#c2b18f]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à mon compte
        </Link>
        <section className="space-y-3 rounded-2xl border border-white/[0.09] bg-[#222321] p-8">
          <h1 className="font-serif text-2xl font-bold">Parrainage</h1>
          <p className="text-sm text-zinc-400">
            Le programme de parrainage n’est pas encore configuré.
          </p>
        </section>
      </div>
    </main>
  )
}
