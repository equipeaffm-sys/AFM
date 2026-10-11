-- 1. SUPPLIERS SEED (Default is_active = false)
INSERT INTO public.suppliers (id, name, code, is_active, shipping_delay_days)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Temu Global Marketplace', 'TEMU', false, 7),
  ('a0000000-0000-4000-8000-000000000002', 'CJ Dropshipping Express', 'CJ', false, 5),
  ('a0000000-0000-4000-8000-000000000003', 'AliExpress Direct Supply', 'ALIEXPRESS', false, 10),
  ('a0000000-0000-4000-8000-000000000004', 'Europe Direct Warehouse', 'EU_DIRECT', false, 2),
  ('a0000000-0000-4000-8000-000000000005', 'Maison L&M Stock Propre', 'LM_PROPRE', true, 1)
ON CONFLICT (code) DO NOTHING;

-- 2. CURRENCIES SEED (EUR Active by default)
INSERT INTO public.currencies (code, symbol, exchange_rate, is_active)
VALUES
  ('EUR', '€', 1.0000, true),
  ('USD', '$', 1.0800, false),
  ('GBP', '£', 0.8500, false),
  ('CHF', 'CHF', 0.9500, false),
  ('CAD', 'CA$', 1.4500, false)
ON CONFLICT (code) DO NOTHING;

-- 3. TAX RATES SEED
INSERT INTO public.tax_rates (country_code, country_name, rate_percent, is_active)
VALUES
  ('FR', 'France', 20.00, true),
  ('BE', 'Belgique', 21.00, true),
  ('US', 'United States', 8.50, false),
  ('GB', 'United Kingdom', 20.00, false),
  ('CH', 'Suisse', 8.10, false)
ON CONFLICT (country_code) DO NOTHING;

-- 4. ATTRIBUTES & ATTRIBUTE VALUES SEED
INSERT INTO public.attributes (id, name, code)
VALUES
  ('b0000000-0000-4000-8000-000000000001', 'Taille Internationale', 'size_int'),
  ('b0000000-0000-4000-8000-000000000002', 'Couleur', 'color'),
  ('b0000000-0000-4000-8000-000000000003', 'Matériau', 'material')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.attribute_values (attribute_id, value, code)
VALUES
  ('b0000000-0000-4000-8000-000000000001', 'Small', 'S'),
  ('b0000000-0000-4000-8000-000000000001', 'Medium', 'M'),
  ('b0000000-0000-4000-8000-000000000001', 'Large', 'L'),
  ('b0000000-0000-4000-8000-000000000002', 'Noir Problématique', 'black'),
  ('b0000000-0000-4000-8000-000000000002', 'Or Champagny', 'gold'),
  ('b0000000-0000-4000-8000-000000000002', 'Crème Soie', 'cream')
ON CONFLICT DO NOTHING;

-- 5. GLOBAL CATEGORIES CATALOG SEED (100+ Categories & Subcategories, Default is_active = false)
-- Main Branches
INSERT INTO public.categories (id, name, slug, icon, is_active, sort_order) VALUES
  ('c1000000-0000-4000-8000-000000000001', 'Mode & Vêtements', 'mode-vetements', 'Shirt', false, 1),
  ('c1000000-0000-4000-8000-000000000002', 'Électronique & High-Tech', 'electronique-hightech', 'Smartphone', false, 2),
  ('c1000000-0000-4000-8000-000000000003', 'Maison, Cuisine & Déco', 'maison-cuisine-deco', 'Home', false, 3),
  ('c1000000-0000-4000-8000-000000000004', 'Beauté, Santé & Soins', 'beaute-sante-soins', 'Sparkles', false, 4),
  ('c1000000-0000-4000-8000-000000000005', 'Bijoux, Montres & Maroquinerie', 'bijoux-montres-maroquinerie', 'Watch', true, 5),
  ('c1000000-0000-4000-8000-000000000006', 'Jouets, Enfants & Bébés', 'jouets-enfants-bebes', 'Gamepad2', false, 6),
  ('c1000000-0000-4000-8000-000000000007', 'Sport, Loisirs & Plein air', 'sport-loisirs-plein-air', 'Dumbbell', false, 7),
  ('c1000000-0000-4000-8000-000000000008', 'Bricolage, Auto & Moto', 'bricolage-auto-moto', 'Wrench', false, 8),
  ('c1000000-0000-4000-8000-000000000009', 'Épicerie Fine & Gastronomie', 'epicerie-fine-gastronomie', 'Utensils', false, 9),
  ('c1000000-0000-4000-8000-000000000010', 'Art, Collection & Luxe', 'art-collection-luxe', 'Crown', true, 10)
ON CONFLICT (slug) DO NOTHING;

-- Subcategories for Mode
INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Homme - Manteaux & Vestes', 'homme-manteaux', 'User', 'c1000000-0000-4000-8000-000000000001', false),
  ('Homme - Chemises & Sweats', 'homme-chemises', 'User', 'c1000000-0000-4000-8000-000000000001', false),
  ('Femme - Robes d''Art', 'femme-robes', 'UserCheck', 'c1000000-0000-4000-8000-000000000001', false),
  ('Femme - Ensembles Soie', 'femme-ensembles', 'UserCheck', 'c1000000-0000-4000-8000-000000000001', false),
  ('Chaussures & Sneakers', 'chaussures-sneakers', 'Footprints', 'c1000000-0000-4000-8000-000000000001', false)
ON CONFLICT (slug) DO NOTHING;

-- Subcategories for Luxe
INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Maison & Art de vivre', 'maison-art-de-vivre', 'Lamp', 'c1000000-0000-4000-8000-000000000010', true),
  ('Maroquinerie & Voyage', 'maroquinerie-voyage', 'Briefcase', 'c1000000-0000-4000-8000-000000000010', true),
  ('Accessoires d''Exception', 'accessoires-d-exception', 'Clock', 'c1000000-0000-4000-8000-000000000010', true),
  ('Éditions Limitées', 'editions-limitees', 'Sparkles', 'c1000000-0000-4000-8000-000000000010', true)
ON CONFLICT (slug) DO NOTHING;
