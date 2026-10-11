'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, Bot, CheckCircle2, CircleAlert, KeyRound, Package, Palette, Settings2 } from 'lucide-react'

export default function AdminSettingsPage() {
  const [chatReady, setChatReady] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/chat')
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to read chat configuration.')
        const result: { configured?: boolean } = await response.json()
        setChatReady(result.configured === true)
      })
      .catch((error) => {
        console.error('Unable to check chat configuration:', error)
        setChatReady(false)
      })
  }, [])

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[#e4ded3] bg-white p-6 shadow-sm sm:p-8">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#806238]">
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          Configuration de la boutique
        </span>
        <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-zinc-950 sm:text-4xl">
          Paramètres
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
          Gérez les contenus et les outils de la boutique. Les réglages affichés ici correspondent à des configurations réelles, sans fausses commandes de sauvegarde.
        </p>
      </header>

      <section className="rounded-2xl border border-[#e4ded3] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eee7db] text-[#66563d]">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-serif text-xl font-semibold text-zinc-950">Conseiller automatique</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-600">
                Le conseiller répond aux questions générales et renvoie vers les fiches produits pour les prix et détails exacts.
              </p>
            </div>
          </div>
          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
              chatReady
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
            role="status"
          >
            {chatReady ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <CircleAlert className="h-4 w-4" aria-hidden="true" />
            )}
            {chatReady === null ? 'Vérification…' : chatReady ? 'Clé détectée côté serveur' : 'En attente de configuration'}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[#e8e1d6] bg-[#faf9f6] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#806238]" aria-hidden="true" />
            <div className="space-y-2 text-sm leading-relaxed text-zinc-700">
              <p className="font-medium text-zinc-900">Ajouter votre clé en sécurité</p>
              <p>
                Dans le fichier local <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">.env.local</code>, ajoutez les variables suivantes, puis redémarrez le serveur. Utilisez un fournisseur compatible avec l’API OpenAI (OpenAI, Groq ou autre).
              </p>
              <pre className="overflow-x-auto rounded-lg border border-[#e4ded3] bg-white p-3 text-xs leading-relaxed text-zinc-700"><code>{`CHAT_API_KEY=votre-cle-privee
CHAT_API_URL=https://api.openai.com/v1/chat/completions
CHAT_MODEL=gpt-4o-mini`}</code></pre>
              <p className="text-xs text-zinc-500">
                Ne mettez jamais une clé dans un composant, dans une variable <code className="font-mono">NEXT_PUBLIC_</code> ou dans un dépôt partagé. La clé reste côté serveur et ne peut pas être modifiée depuis le navigateur.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          La clé n’est jamais affichée ni enregistrée dans Supabase. Le statut ci-dessus indique uniquement si une variable serveur est présente.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SettingsLink
          href="/admin/products"
          icon={Package}
          title="Produits et stocks"
          description="Publier des articles, ajuster les prix et gérer les quantités."
        />
        <SettingsLink
          href="/admin/categories"
          icon={Settings2}
          title="Catégories"
          description="Créer les rayons visibles dans la boutique."
        />
        <SettingsLink
          href="/admin/appearance"
          icon={Palette}
          title="Apparence"
          description="Modifier les contenus et les sections de la page d’accueil."
        />
      </section>
    </div>
  )
}

function SettingsLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="motion-link group rounded-2xl border border-[#e4ded3] bg-white p-5 shadow-sm hover:border-[#c7b89e] hover:shadow-md"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3f0e9] text-[#66563d]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <h3 className="mt-4 flex items-center justify-between font-medium text-zinc-900">
        {title}
        <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-[#806238]" />
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-zinc-600">{description}</p>
    </Link>
  )
}
