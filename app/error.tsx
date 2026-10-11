'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Home, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', {
      message: error.message,
      digest: error.digest,
    })
  }, [error])

  return (
    <main className="flex min-h-[85vh] flex-col items-center justify-center space-y-8 bg-zinc-950 px-4 py-16">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
        <div className="space-y-2">
          <h1 className="mt-2 font-serif text-2xl font-bold text-zinc-100">
            Une erreur est survenue
          </h1>
          <p className="text-xs leading-relaxed text-zinc-400">
            Réessayez ou retournez à l’accueil.
          </p>
        </div>

        {error.digest && (
          <p className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-[10px] text-zinc-500">
            Référence : {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#665d4d] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-100 transition-colors hover:bg-[#756a56]"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-300 transition-colors hover:border-zinc-500"
          >
            <Home className="h-4 w-4" />
            Accueil
          </Link>
        </div>
      </section>
    </main>
  )
}
