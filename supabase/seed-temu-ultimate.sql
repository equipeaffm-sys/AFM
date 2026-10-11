-- Ultimate Temu-Style Global Catalog Seed (100+ Categories across 10 Branches, Default is_active = false)

-- 1. Mode Femme
INSERT INTO public.categories (id, name, slug, icon, is_active, sort_order)
VALUES ('e1000000-0000-4000-8000-000000000001', 'Mode Femme', 'mode-femme', 'UserCheck', false, 1)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Robes & Combinaisons', 'femme-robes-combinaisons', 'UserCheck', 'e1000000-0000-4000-8000-000000000001', false),
  ('Hauts & T-Shirts Femme', 'femme-hauts', 'UserCheck', 'e1000000-0000-4000-8000-000000000001', false),
  ('Pantalons & Jupes', 'femme-pantalons-jupes', 'UserCheck', 'e1000000-0000-4000-8000-000000000001', false),
  ('Lingerie & Nuit Femme', 'femme-lingerie', 'Heart', 'e1000000-0000-4000-8000-000000000001', false),
  ('Chaussures Femme', 'femme-chaussures', 'Footprints', 'e1000000-0000-4000-8000-000000000001', false),
  ('Sacs & Pocquettes Femme', 'femme-sacs', 'Briefcase', 'e1000000-0000-4000-8000-000000000001', false)
ON CONFLICT (slug) DO NOTHING;

-- 2. Mode Homme
INSERT INTO public.categories (id, name, slug, icon, is_active, sort_order)
VALUES ('e1000000-0000-4000-8000-000000000002', 'Mode Homme', 'mode-homme', 'User', false, 2)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('T-Shirts & Polos Homme', 'homme-tshirts-polos', 'Shirt', 'e1000000-0000-4000-8000-000000000002', false),
  ('Chemises & Vestes Homme', 'homme-chemises-vestes', 'Shirt', 'e1000000-0000-4000-8000-000000000002', false),
  ('Costumes & Blazers', 'homme-costumes', 'Shirt', 'e1000000-0000-4000-8000-000000000002', false),
  ('Sportswear & Sweats Homme', 'homme-sportswear', 'Dumbbell', 'e1000000-0000-4000-8000-000000000002', false),
  ('Chaussures Homme', 'homme-chaussures', 'Footprints', 'e1000000-0000-4000-8000-000000000002', false),
  ('Maroquinerie Homme', 'homme-maroquinerie', 'Briefcase', 'e1000000-0000-4000-8000-000000000002', false)
ON CONFLICT (slug) DO NOTHING;

-- 3. Électronique & High-Tech
INSERT INTO public.categories (id, name, slug, icon, is_active, sort_order)
VALUES ('e1000000-0000-4000-8000-000000000003', 'Électronique & High-Tech', 'hightech-electronique', 'Smartphone', false, 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Smartphones & Accessoires', 'smartphones-accessoires', 'Tablet', 'e1000000-0000-4000-8000-000000000003', false),
  ('Audio, Casques & Écouteurs', 'audio-casques-ecouteurs', 'Headphones', 'e1000000-0000-4000-8000-000000000003', false),
  ('PC, Laptops & Gaming', 'pc-gaming-accessoires', 'Monitor', 'e1000000-0000-4000-8000-000000000003', false),
  ('Montres Connectées & Smartwatches', 'smartwatches', 'Watch', 'e1000000-0000-4000-8000-000000000003', false),
  ('Photo, Vidéo & Drones', 'photo-video-drones', 'Camera', 'e1000000-0000-4000-8000-000000000003', false)
ON CONFLICT (slug) DO NOTHING;

-- 4. Maison, Cuisine & Déco
INSERT INTO public.categories (id, name, slug, icon, is_active, sort_order)
VALUES ('e1000000-0000-4000-8000-000000000004', 'Maison, Cuisine & Déco', 'maison-cuisine-deco-global', 'Home', false, 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Rangement & Organisation Maison', 'rangement-organisation-home', 'Box', 'e1000000-0000-4000-8000-000000000004', false),
  ('Décoration Intérieure', 'decoration-interieure', 'Sparkles', 'e1000000-0000-4000-8000-000000000004', false),
  ('Arts de la Table & Ustensiles', 'arts-de-la-table-ustensiles', 'Utensils', 'e1000000-0000-4000-8000-000000000004', false),
  ('Linge de Lit & Bain', 'linge-lit-bain', 'Bed', 'e1000000-0000-4000-8000-000000000004', false),
  ('Éclairage LED & Lampes', 'eclairage-led-lampes', 'Lamp', 'e1000000-0000-4000-8000-000000000004', false)
ON CONFLICT (slug) DO NOTHING;

-- 5. Beauté & Soins
INSERT INTO public.categories (id, name, slug, icon, is_active, sort_order)
VALUES ('e1000000-0000-4000-8000-000000000005', 'Beauté & Soins', 'beaute-soins-global', 'Sparkles', false, 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Maquillage Pro', 'maquillage-pro', 'Palette', 'e1000000-0000-4000-8000-000000000005', false),
  ('Parfums & Eaux de Toilette', 'parfums-eaux-toilette', 'Flame', 'e1000000-0000-4000-8000-000000000005', false),
  ('Soins Visage & Corps', 'soins-visage-corps-global', 'Sun', 'e1000000-0000-4000-8000-000000000005', false),
  ('Soins Capillaires & Coiffage', 'soins-capillaires-coiffage', 'Scissors', 'e1000000-0000-4000-8000-000000000005', false)
ON CONFLICT (slug) DO NOTHING;

-- 6. Bijoux & Horlogerie d'Exception (ACTIVE BY DEFAULT FOR L&M)
INSERT INTO public.categories (id, name, slug, icon, is_active, sort_order)
VALUES ('e1000000-0000-4000-8000-000000000006', 'Bijoux & Horlogerie d''Exception', 'bijoux-horlogerie-exception', 'Crown', true, 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Maison & Art de vivre L&M', 'maison-art-de-vivre-lm', 'Lamp', 'e1000000-0000-4000-8000-000000000006', true),
  ('Maroquinerie & Voyage L&M', 'maroquinerie-voyage-lm', 'Briefcase', 'e1000000-0000-4000-8000-000000000006', true),
  ('Accessoires d''Exception L&M', 'accessoires-d-exception-lm', 'Clock', 'e1000000-0000-4000-8000-000000000006', true),
  ('Éditions Limitées L&M', 'editions-limitees-lm', 'Sparkles', 'e1000000-0000-4000-8000-000000000006', true)
ON CONFLICT (slug) DO NOTHING;

-- 7. Sport & Outdoor
INSERT INTO public.categories (id, name, slug, icon, is_active, sort_order)
VALUES ('e1000000-0000-4000-8000-000000000007', 'Sport & Outdoor', 'sport-outdoor-global', 'Dumbbell', false, 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Fitness & Musculation Home', 'fitness-musculation-home', 'Zap', 'e1000000-0000-4000-8000-000000000007', false),
  ('Camping, Randonnée & Bivouac', 'camping-randonnee-bivouac', 'Compass', 'e1000000-0000-4000-8000-000000000007', false),
  ('Cycles & Mobilité Électrique', 'cycles-mobilite-electrique', 'Trophy', 'e1000000-0000-4000-8000-000000000007', false)
ON CONFLICT (slug) DO NOTHING;

-- 8. Enfants & Bébés
INSERT INTO public.categories (id, name, slug, icon, is_active, sort_order)
VALUES ('e1000000-0000-4000-8000-000000000008', 'Enfants & Bébés', 'enfants-bebes-global', 'Smile', false, 8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Vêtements Bébés & Enfants', 'vetements-bebes-enfants', 'Smile', 'e1000000-0000-4000-8000-000000000008', false),
  ('Jouets Éducatifs & Jeux', 'jouets-educatifs-jeux', 'Gamepad2', 'e1000000-0000-4000-8000-000000000008', false)
ON CONFLICT (slug) DO NOTHING;

-- 9. Auto & Moto
INSERT INTO public.categories (id, name, slug, icon, is_active, sort_order)
VALUES ('e1000000-0000-4000-8000-000000000009', 'Auto & Moto', 'auto-moto-global', 'Wrench', false, 9)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Accessoires Interieurs Auto', 'accessoires-interieurs-auto', 'Car', 'e1000000-0000-4000-8000-000000000009', false),
  ('Outillage & Entretien Véhicules', 'outillage-entretien-vehicules', 'Hammer', 'e1000000-0000-4000-8000-000000000009', false)
ON CONFLICT (slug) DO NOTHING;

-- 10. Épicerie Fine & Gastronomie
INSERT INTO public.categories (id, name, slug, icon, is_active, sort_order)
VALUES ('e1000000-0000-4000-8000-000000000010', 'Épicerie Fine & Gastronomie', 'epicerie-fine-gastronomie-global', 'Utensils', false, 10)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Cafés & Thés d''Exception', 'cafes-thes-exception', 'Coffee', 'e1000000-0000-4000-8000-000000000010', false),
  ('Chocolats & Confiseries de Luxe', 'chocolats-confiseries-luxe', 'Gift', 'e1000000-0000-4000-8000-000000000010', false)
ON CONFLICT (slug) DO NOTHING;
