import Link from 'next/link'

export default function SuccessPage() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-zinc-950 px-4 py-16">
      <section className="w-full max-w-2xl space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-100 sm:p-12">
        <h1 className="font-serif text-3xl font-bold">Commandes temporairement indisponibles</h1>
        <p className="text-sm text-zinc-400">
          Cette page ne confirme aucun paiement. La validation des commandes sera disponible
          lorsque les conditions de livraison auront été configurées.
        </p>
        <Link
          href="/products"
          className="inline-block rounded-lg border border-zinc-700 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-300 transition-colors hover:border-zinc-500"
        >
          Retour au catalogue
        </Link>
      </section>
    </main>
  )
}
