import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AccountClubPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 transition-colors hover:text-amber-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à mon compte
        </Link>
        <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
          <h1 className="font-serif text-2xl font-bold">Programme de fidélité</h1>
          <p className="text-sm text-zinc-400">
            Le programme de fidélité n’est pas encore configuré.
          </p>
        </section>
      </div>
    </main>
  )
}
