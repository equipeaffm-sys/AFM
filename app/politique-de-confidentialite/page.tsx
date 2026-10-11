export const metadata = {
  title: 'Politique de confidentialité | L&M',
  description: 'Politique de confidentialité du site L&M.',
}

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-zinc-100 space-y-8">
      <header className="text-center border-b border-zinc-800 pb-8">
        <h1 className="text-4xl font-serif font-bold">Politique de confidentialité</h1>
      </header>

      <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-300 leading-relaxed">
        <p>
          Les informations sur les données collectées, leur utilisation, leur
          durée de conservation et les moyens d&apos;exercer vos droits ne sont
          pas encore renseignées. Cette politique doit être complétée avant
          toute mise en ligne publique.
        </p>
      </section>
    </div>
  )
}
