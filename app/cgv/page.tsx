export const metadata = {
  title: 'Conditions générales de vente | L&M',
  description: 'Conditions générales de vente du site L&M.',
}

export default function CGVPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-zinc-100 space-y-8">
      <header className="text-center border-b border-zinc-800 pb-8">
        <h1 className="text-4xl font-serif font-bold">Conditions générales de vente</h1>
      </header>

      <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-300 leading-relaxed">
        <p>
          Les conditions de vente ne sont pas encore renseignées. Elles doivent
          être complétées et validées avant l&apos;ouverture des commandes.
        </p>
      </section>
    </div>
  )
}
