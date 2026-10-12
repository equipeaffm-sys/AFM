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
commandes est préparée avec Stripe Checkout hébergé, mais reste désactivée par défaut.
Consultez la section **Paiements Stripe** avant toute activation. Les prix et stocks sont
relus côté serveur; les valeurs du panier dans le navigateur ne sont jamais utilisées pour
facturer. Le checkout utilise les moyens de paiement dynamiques configurés dans Stripe, et
requiert des tarifs de livraison réels.

## Administration

L’administration n’est pas exposée dans la navigation publique. Son accès est contrôlé par
Supabase Auth, les rôles en base et les politiques RLS ; son URL n’est pas considérée comme un
secret. Le script [`supabase/complete-setup.sql`](./supabase/complete-setup.sql) configure le
schéma de la boutique, les rôles/RLS et le bucket public `product-images` (lecture publique,
écriture réservée au personnel). Il peut être rejoué sur une nouvelle base ou une base déjà au
schéma L&M actuel et ne crée aucun faux produit. Il s’arrête sans changement si les anciens types
SQL incompatibles sont détectés. Sauvegardez une base existante avant la migration. Pour attribuer
le rôle administrateur à votre propre compte après inscription,
suivez [`supabase/ADMIN_SETUP.md`](./supabase/ADMIN_SETUP.md). N’ajoutez jamais de mot de passe,
de clé S3 ou de clé Supabase privée au code ou au dépôt.
Si le SQL Editor ne permet pas de modifier `storage.objects`, le script affiche un avertissement
et applique le reste de la configuration. Terminez alors les politiques Storage depuis le
tableau de bord en suivant le guide d’administration.
Pour que l’inscription ne requière pas de vérification par e-mail, désactivez **Confirm email**
dans **Supabase → Authentication → Providers → Email**. Cette option autorise les comptes
utilisant des adresses non vérifiées; elle ne peut pas être modifiée depuis le code du site.

## Conseiller de la boutique

Le widget fournit des réponses locales aux questions fréquentes (catalogue, compte,
commandes, livraison et retours) et fonctionne sans clé ni service externe. Pour activer les
réponses IA avec xAI, définissez `XAI_API_KEY` dans `.env.local` ou dans les variables du
serveur. L’endpoint compatible OpenAI `https://api.x.ai/v1/chat/completions` et le modèle
`grok-4.7` sont utilisés par défaut; vous pouvez les remplacer avec `CHAT_API_URL` et
`CHAT_MODEL` si nécessaire. Une ancienne variable `CHAT_API_KEY` reste prise en charge si
`XAI_API_KEY` n’est pas définie. Un exemple est disponible dans `.env.local.example`.
Redémarrez le serveur après modification. La clé est lue uniquement côté serveur : ne la
préfixez pas par `NEXT_PUBLIC_` et ne la commitez pas.

## E-mails avec Resend

Pour les e-mails d’inscription, de confirmation d’adresse et de réinitialisation du mot de
passe, configurez Resend comme SMTP personnalisé dans Supabase **Authentication → Email →
SMTP Settings**. Vérifiez d’abord votre domaine d’envoi dans Resend, puis utilisez l’hôte
`smtp.resend.com`, le port `465`, l’identifiant `resend` et votre clé API Resend comme mot de
passe. Choisissez comme expéditeur une adresse de ce domaine vérifié et configurez les modèles
d’e-mail dans **Authentication → Email Templates**. Ces messages sont générés par Supabase Auth
afin de conserver des liens de confirmation et de récupération sûrs. Le formulaire `/login`
permet au client de demander un lien « Mot de passe oublié ? » puis de choisir son nouveau mot
de passe après l’avoir ouvert.

Le webhook Stripe envoie aussi un e-mail de confirmation de paiement avec Resend lorsque
`RESEND_API_KEY` et `RESEND_FROM_EMAIL` sont configurées côté serveur. Ajoutez ces deux
variables dans Vercel avec une clé API Resend et une adresse expéditeur vérifiée. Le paiement
reste désactivé tant que `PAYMENTS_ENABLED` n’est pas explicitement défini sur `true`.
N’utilisez jamais `NEXT_PUBLIC_` pour une clé Resend.

## Paiements Stripe

Le site utilise Stripe Checkout hébergé. Le paramètre `payment_method_types` n’est volontairement
pas fixé dans le code : Stripe sélectionne les moyens de paiement dynamiques autorisés dans le
Dashboard, selon le pays, la devise et l’éligibilité du client. Activez-y les méthodes voulues;
Apple Pay et Google Pay apparaissent uniquement lorsque le compte, le navigateur et le domaine
sont éligibles. Il n’est pas possible de garantir que tous les moyens existent pour chaque pays.

Avant de l’ouvrir :

1. **Zones de livraison (administrables).** Le checkout n’utilise plus un tarif unique. Créez d’abord
   dans Stripe un tarif d’expédition (`shr_...`) **par zone** que vous comptez desservir, puis, dans
   l’administration (`/admin/shipping`), renseignez chaque zone (France, Europe hors France,
   International) : la liste des pays (codes ISO à deux lettres), le transporteur, les frais, le seuil
   de livraison gratuite et l’identifiant de tarif Stripe `shr_...` correspondant. Aucune valeur n’est
   préremplie : une zone mal renseignée n’ouvre pas le paiement.
2. Dans **Stripe → Paramètres → Moyens de paiement**, activez ceux que vous souhaitez proposer.
   Configurez et vérifiez aussi le domaine pour les wallets si Stripe le demande.
3. Dans `.env.local` ou Vercel, configurez `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`. Les pays
   autorisés et les tarifs de livraison ne sont **plus** des variables d’environnement : ils proviennent
   des tables Supabase `shipping_zones` et `tax_rates` éditées dans l’administration. Les anciennes
   variables `STRIPE_ALLOWED_COUNTRIES` et `STRIPE_SHIPPING_RATE_ID` ne sont plus utilisées.
   Checkout hébergé ne nécessite pas de clé publique Stripe dans le navigateur.
   Utilisez `sk_test_...` et le secret du webhook de test pour les tests; configurez des secrets
   distincts pour la production.
4. Créez un endpoint webhook Stripe vers
   `https://VOTRE-DOMAINE/api/webhooks/stripe` pour les événements
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed` et `checkout.session.expired`. Copiez son secret
   `whsec_...` dans `STRIPE_WEBHOOK_SECRET`.
5. Exécutez `supabase/complete-setup.sql` dans le SQL Editor Supabase pour installer les fonctions
   transactionnelles de création de commande, la réservation/libération du stock et les tables
   `shipping_zones` et `tax_rates`. La clé `SUPABASE_SERVICE_ROLE_KEY` reste exclusivement côté serveur.
6. **Règles fiscales (administrables).** Dans `/admin/finance/taxes`, renseignez un taux de TVA par pays
   desservi. Aucun taux n’est prérempli ; un pays sans taux actif et décidé bloque le paiement. Le
   calcul Stripe des taxes n’est pas activé automatiquement : validez votre traitement fiscal (prix
   TTC/HT, mentions légales) avant d’accepter des paiements réels.
7. Faites un parcours complet avec les clés test et le webhook test. Passez `PAYMENTS_ENABLED=true`
   seulement après avoir validé les règles réelles de livraison, de taxes et de commande; laissez
   cette variable à `false` jusque-là.

Le checkout facture en euros et les tarifs fournis sont ceux créés dans Stripe. Le paiement reste
verrouillé (message clair, aucun montant fictif) tant que `PAYMENTS_ENABLED` n’est pas à `true` ou
qu’une zone active n’a pas de tarif Stripe valide et un taux de TVA renseigné pour chacun de ses pays.
Ne commitez jamais de clés Stripe ou Supabase et ne préfixez aucune clé secrète par `NEXT_PUBLIC_`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
