-- Temu-Style Marketplace Dynamic Categories Seed (Default: is_active = false)

-- 1. Mode & Vêtements
INSERT INTO public.categories (id, name, slug, icon, is_active)
VALUES ('11111111-0000-4000-8000-000000000001', 'Mode & Vêtements', 'mode-vetements', 'Shirt', false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Homme', 'vetements-homme', 'User', '11111111-0000-4000-8000-000000000001', false),
  ('Femme', 'vetements-femme', 'UserCheck', '11111111-0000-4000-8000-000000000001', false),
  ('Enfants', 'vetements-enfants', 'Smile', '11111111-0000-4000-8000-000000000001', false),
  ('Chaussures', 'chaussures', 'Footprints', '11111111-0000-4000-8000-000000000001', false),
  ('Lingerie & Nuit', 'lingerie-nuit', 'Heart', '11111111-0000-4000-8000-000000000001', false)
ON CONFLICT (slug) DO NOTHING;

-- 2. Électronique & High-Tech
INSERT INTO public.categories (id, name, slug, icon, is_active)
VALUES ('22222222-0000-4000-8000-000000000002', 'Électronique & High-Tech', 'electronique-hightech', 'Smartphone', false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Smartphones & Tablettes', 'smartphones-tablettes', 'Tablet', '22222222-0000-4000-8000-000000000002', false),
  ('Audio & Écouteurs', 'audio-ecouteurs', 'Headphones', '22222222-0000-4000-8000-000000000002', false),
  ('Accessoires PC & Gaming', 'accessoires-pc-gaming', 'Monitor', '22222222-0000-4000-8000-000000000002', false),
  ('Maison Connectée', 'maison-connectee', 'Wifi', '22222222-0000-4000-8000-000000000002', false),
  ('Gadgets & Connectique', 'gadgets-connectique', 'Cpu', '22222222-0000-4000-8000-000000000002', false)
ON CONFLICT (slug) DO NOTHING;

-- 3. Maison, Cuisine & Déco
INSERT INTO public.categories (id, name, slug, icon, is_active)
VALUES ('33333333-0000-4000-8000-000000000003', 'Maison, Cuisine & Déco', 'maison-cuisine-deco', 'Home', false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Rangement & Organisation', 'rangement-organisation', 'Box', '33333333-0000-4000-8000-000000000003', false),
  ('Arts de la Table', 'arts-de-la-table', 'Utensils', '33333333-0000-4000-8000-000000000003', false),
  ('Éclairage & Lampes', 'eclairage-lampes', 'Lamp', '33333333-0000-4000-8000-000000000003', false),
  ('Linge de Maison', 'linge-de-maison', 'Bed', '33333333-0000-4000-8000-000000000003', false),
  ('Jardin & Extérieur', 'jardin-exterieur', 'Trees', '33333333-0000-4000-8000-000000000003', false)
ON CONFLICT (slug) DO NOTHING;

-- 4. Beauté, Santé & Soins
INSERT INTO public.categories (id, name, slug, icon, is_active)
VALUES ('44444444-0000-4000-8000-000000000004', 'Beauté, Santé & Soins', 'beaute-sante-soins', 'Sparkles', false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Maquillage', 'maquillage', 'Palette', '44444444-0000-4000-8000-000000000004', false),
  ('Soins Visage & Corps', 'soins-visage-corps', 'Sun', '44444444-0000-4000-8000-000000000004', false),
  ('Soins Capillaires', 'soins-capillaires', 'Scissors', '44444444-0000-4000-8000-000000000004', false),
  ('Parfums & Senteurs', 'parfums-senteurs', 'Flame', '44444444-0000-4000-8000-000000000004', false),
  ('Bien-être & Relaxation', 'bien-etre-relaxation', 'Activity', '44444444-0000-4000-8000-000000000004', false)
ON CONFLICT (slug) DO NOTHING;

-- 5. Bijoux, Montres & Maroquinerie
INSERT INTO public.categories (id, name, slug, icon, is_active)
VALUES ('55555555-0000-4000-8000-000000000005', 'Bijoux, Montres & Maroquinerie', 'bijoux-montres-maroquinerie', 'Watch', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Sacs & Maintien', 'sacs-maintien', 'Briefcase', '55555555-0000-4000-8000-000000000005', true),
  ('Horlogerie', 'horlogerie-haute', 'Clock', '55555555-0000-4000-8000-000000000005', true),
  ('Bijoux & Joaillerie', 'bijoux-joaillerie', 'Gem', '55555555-0000-4000-8000-000000000005', true),
  ('Portefeuilles & Étuis', 'portefeuilles-etuis', 'CreditCard', '55555555-0000-4000-8000-000000000005', true)
ON CONFLICT (slug) DO NOTHING;

-- 6. Jouets, Enfants & Bébés
INSERT INTO public.categories (id, name, slug, icon, is_active)
VALUES ('66666666-0000-4000-8000-000000000006', 'Jouets, Enfants & Bébés', 'jouets-enfants-bebes', 'Gamepad2', false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Jeux Éducatifs', 'jeux-educatifs', 'BookOpen', '66666666-0000-4000-8000-000000000006', false),
  ('Peluches & Figurines', 'peluches-figurines', 'Gift', '66666666-0000-4000-8000-000000000006', false),
  ('Puériculture', 'puericulture', 'Baby', '66666666-0000-4000-8000-000000000006', false)
ON CONFLICT (slug) DO NOTHING;

-- 7. Sport, Loisirs & Plein air
INSERT INTO public.categories (id, name, slug, icon, is_active)
VALUES ('77777777-0000-4000-8000-000000000007', 'Sport, Loisirs & Plein air', 'sport-loisirs-plein-air', 'Dumbbell', false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Fitness & Musculation', 'fitness-musculation', 'Zap', '77777777-0000-4000-8000-000000000007', false),
  ('Camping & Randonnée', 'camping-randonnee', 'Compass', '77777777-0000-4000-8000-000000000007', false),
  ('Sports d''Équipe', 'sports-equipe', 'Trophy', '77777777-0000-4000-8000-000000000007', false)
ON CONFLICT (slug) DO NOTHING;

-- 8. Bricolage, Auto & Moto
INSERT INTO public.categories (id, name, slug, icon, is_active)
VALUES ('88888888-0000-4000-8000-000000000008', 'Bricolage, Auto & Moto', 'bricolage-auto-moto', 'Wrench', false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Outillage à Main', 'outillage-main', 'Hammer', '88888888-0000-4000-8000-000000000008', false),
  ('Accessoires Auto & Moto', 'accessoires-auto-moto', 'Car', '88888888-0000-4000-8000-000000000008', false)
ON CONFLICT (slug) DO NOTHING;
