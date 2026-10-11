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
   activez l’inscription par e-mail et ajoutez les URL locales/de production dans
   **Authentication → URL Configuration**.
2. Créez votre propre utilisateur avec une adresse e-mail que vous contrôlez, via l’inscription
   du site ou Supabase **Authentication → Users**. Confirmez l’adresse e-mail.
3. Dans Supabase **SQL Editor**, vérifiez que le compte possède bien un profil client :

   ```sql
   SELECT profiles.id, profiles.email, profiles.role
   FROM public.profiles AS profiles
   JOIN auth.users AS users ON users.id = profiles.id
   WHERE lower(users.email) = lower('votre-adresse@exemple.fr')
     AND users.email_confirmed_at IS NOT NULL;
   ```

4. Après avoir vérifié qu’une seule ligne correspond à votre propre compte, attribuez-lui le
   rôle administrateur en remplaçant l’adresse dans cette requête :

   ```sql
   UPDATE public.profiles AS profiles
   SET role = 'super_admin'
   FROM auth.users AS users
   WHERE profiles.id = users.id
     AND lower(users.email) = lower('votre-adresse@exemple.fr')
     AND users.email_confirmed_at IS NOT NULL
   RETURNING profiles.id, profiles.email, profiles.role;
   ```

   N’exécutez cette requête que depuis le SQL Editor du projet Supabase après avoir confirmé
   l’adresse et vérifié le compte retourné. Elle ne retourne aucune ligne si le compte n’existe
   pas ou si son adresse n’est pas confirmée.

5. Connectez-vous sur `/login?redirect=%2Fadmin` avec l’adresse et le mot de passe que vous
   avez choisis dans Supabase. Activez l’authentification multifacteur dans Supabase pour ce
   compte et conservez les moyens de récupération en lieu sûr.

Les nouveaux comptes sont toujours créés avec le rôle `customer`. Aucun compte ou mot de passe
administrateur partagé n’est intégré au dépôt. Le rôle `super_admin` peut être révoqué depuis le
SQL Editor en replaçant `super_admin` par `customer` pour le profil concerné.

La migration de sécurité préserve les rôles administrateur déjà attribués afin d’éviter de
verrouiller le propriétaire actuel. Après avoir confirmé l’accès du compte personnel que vous
contrôlez, vérifiez les anciens profils `super_admin` et rétrogradez uniquement ceux qui ne
doivent plus administrer le site.
