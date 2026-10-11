This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Catalogue et commandes

Le catalogue affiche uniquement les produits enregistrés dans Supabase. La validation des
commandes est temporairement désactivée tant que les conditions réelles de livraison ne sont
pas définies. Avant de l’activer, renseignez également les vraies clés Stripe et Resend dans
`.env.local` et implémentez les conditions de commande applicables.

## Administration

L’administration n’est pas exposée dans la navigation publique. Son accès est contrôlé par
Supabase Auth, les rôles en base et les politiques RLS ; son URL n’est pas considérée comme un
secret. Pour créer votre propre compte administrateur sans identifiants codés en dur, suivez
[`supabase/ADMIN_SETUP.md`](./supabase/ADMIN_SETUP.md). Pour une base déjà installée, exécutez
[`supabase/admin-security-hardening.sql`](./supabase/admin-security-hardening.sql) dans le SQL
Editor Supabase. N’ajoutez jamais de mot de passe ou de clé privée au code ou au dépôt.

## Conseiller de la boutique

Le widget fournit des réponses locales aux questions fréquentes (catalogue, compte,
commandes, livraison et retours) et fonctionne sans clé ni service externe. Pour activer les
réponses IA avec Groq, définissez `CHAT_API_KEY` (ou `GROQ_API_KEY`) dans `.env.local`. L’endpoint Groq compatible
OpenAI et le modèle `llama-3.3-70b-versatile` sont utilisés par défaut; vous pouvez les
remplacer avec `CHAT_API_URL` et `CHAT_MODEL` si nécessaire. Un exemple est disponible dans
`.env.local.example`. Redémarrez le serveur après modification. La clé est lue uniquement
côté serveur : ne la préfixez pas par `NEXT_PUBLIC_` et ne la commitez pas.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
