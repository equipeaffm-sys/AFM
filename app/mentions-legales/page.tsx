export const metadata = {
  title: 'Mentions légales | L&M',
  description: 'Informations légales concernant le site L&M.',
}

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-zinc-100 space-y-8">
      <header className="text-center border-b border-zinc-800 pb-8">
        <h1 className="text-4xl font-serif font-bold">Mentions légales</h1>
      </header>

      <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-300 leading-relaxed">
        <p>
          Les informations officielles de l&apos;éditeur du site et de son hébergeur
          ne sont pas encore renseignées. Elles doivent être complétées et
          vérifiées avant toute mise en ligne publique.
        </p>
      </section>
    </div>
  )
}
