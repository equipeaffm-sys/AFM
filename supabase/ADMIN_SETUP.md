# Configurer l’accès administrateur

L’administration est volontairement absente de la navigation publique, mais son URL n’est
pas un secret. La protection repose sur Supabase Auth, le rôle `profiles.role`, le middleware
du serveur et les politiques Row Level Security (RLS). Ne placez jamais un identifiant, un mot
de passe ou une clé Supabase privée dans le code, le navigateur ou Git.

## Première configuration

1. Faites une sauvegarde de la base, puis exécutez une seule fois tout le contenu de
   `complete-setup.sql` dans Supabase **SQL Editor**. Le même script convient à une nouvelle
   base ou à une base existante utilisant déjà le schéma L&M actuel. Il ne supprime pas les
   commandes, produits, catégories ou rôles existants et ne crée aucun produit de démonstration.
   Il crée aussi le bucket public `product-images` avec ajout/suppression réservés aux rôles
   `editor` et `super_admin`. Si la base utilise les anciens rôles `client/admin/vip` ou une
   structure différente, le script s’arrête sans changement : fais d’abord une migration
   dédiée au lieu de supprimer ou recréer tes tables.
   Le script ne configure pas les options d’authentification du tableau de bord Supabase :
   activez l’inscription par e-mail dans **Authentication → Providers → Email**. Pour ne pas
   demander de confirmation par e-mail avant la connexion, désactivez **Confirm email** dans
   les options du fournisseur Email, puis ajoutez les URL locales/de production dans
   **Authentication → URL Configuration**. La désactivation permet à toute personne de créer
   un compte avec une adresse non vérifiée : utilisez un mot de passe robuste et ne prenez pas
   l’adresse comme preuve d’identité.
   Si le résultat SQL affiche l’avertissement `Storage policies were not changed`, Supabase
   n’autorise pas le rôle SQL à modifier sa table gérée `storage.objects`. Le reste du script
   est quand même appliqué. Dans ce cas, ouvrez **Storage → Policies** et créez sur
   `product-images` les trois politiques suivantes pour le rôle `authenticated` :

   - **INSERT** — autoriser si `bucket_id = 'product-images' AND public.is_editor_or_above()`.
   - **UPDATE** — conditions USING et WITH CHECK : `bucket_id = 'product-images' AND public.is_editor_or_above()`.
   - **DELETE** — autoriser si `bucket_id = 'product-images' AND public.is_editor_or_above()`.

   Le bucket est public pour servir les images : n’ajoutez jamais de règle d’upload publique.
   Supabase gère déjà RLS et la propriété de sa table Storage; le script ne tente pas de les
   modifier.
2. Pour envoyer les e-mails de compte via Resend, vérifiez un domaine d’envoi dans Resend, puis
   ouvrez **Authentication → Email → SMTP Settings** dans Supabase et activez le SMTP
   personnalisé :

   - Hôte : `smtp.resend.com`
   - Port : `465`
   - Identifiant : `resend`
   - Mot de passe : une clé API Resend (à saisir dans Supabase, jamais dans le dépôt)
   - Expéditeur : une adresse appartenant au domaine vérifié dans Resend

   Le SMTP reste utile pour les e-mails de récupération de mot de passe. Comme **Confirm email**
   est désactivé, l’inscription ne dépend plus de l’envoi d’un e-mail de confirmation.
3. Créez votre compte avec une adresse e-mail que vous contrôlez et connectez-vous. Il n’est
   plus nécessaire de confirmer l’adresse par e-mail.
4. Dans Supabase **SQL Editor**, vérifiez que le compte possède bien un profil client :

   ```sql
   SELECT profiles.id, profiles.email, profiles.role
   FROM public.profiles AS profiles
   JOIN auth.users AS users ON users.id = profiles.id
   WHERE lower(users.email) = lower('votre-adresse@exemple.fr');
   ```

5. Après avoir vérifié qu’une seule ligne correspond à votre propre compte, attribuez-lui le
   rôle administrateur en remplaçant l’adresse dans cette requête :

   ```sql
   UPDATE public.profiles AS profiles
   SET role = 'super_admin'
   FROM auth.users AS users
   WHERE profiles.id = users.id
     AND lower(users.email) = lower('votre-adresse@exemple.fr')
   RETURNING profiles.id, profiles.email, profiles.role;
   ```

   N’exécutez cette requête que depuis le SQL Editor du projet Supabase après vous être connecté
   au site avec ce compte et avoir vérifié qu’une seule ligne correspond à votre propre adresse.

6. Connectez-vous sur `/login?redirect=%2Fadmin` avec l’adresse et le mot de passe que vous
   avez choisis dans Supabase. Activez l’authentification multifacteur dans Supabase pour ce
   compte et conservez les moyens de récupération en lieu sûr.

Les nouveaux comptes sont toujours créés avec le rôle `customer`. Aucun compte ou mot de passe
administrateur partagé n’est intégré au dépôt. Le rôle `super_admin` peut être révoqué depuis le
SQL Editor en replaçant `super_admin` par `customer` pour le profil concerné.

La migration de sécurité préserve les rôles administrateur déjà attribués afin d’éviter de
verrouiller le propriétaire actuel. Après avoir vérifié l’accès du compte personnel que vous
contrôlez, vérifiez les anciens profils `super_admin` et rétrogradez uniquement ceux qui ne
doivent plus administrer le site.
