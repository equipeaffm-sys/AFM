-- Schema SQL pour Supabase - Plateforme E-Commerce de Luxe L&M

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types Enum
CREATE TYPE user_role AS ENUM ('client', 'admin', 'vip');
CREATE TYPE b2b_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. B2B Profiles
CREATE TABLE IF NOT EXISTS b2b_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  vat_number TEXT NOT NULL,
  is_vat_valid BOOLEAN NOT NULL DEFAULT FALSE,
  billing_address JSONB,
  status b2b_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_digital_service BOOLEAN NOT NULL DEFAULT FALSE,
  images TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Cross Sells
CREATE TABLE IF NOT EXISTS cross_sells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_cross_sell UNIQUE(product_id, recommended_product_id)
);

-- 6. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status order_status NOT NULL DEFAULT 'pending',
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  shipping_address JSONB,
  tracking_number TEXT,
  custom_note TEXT,
  affiliate_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase_cents INTEGER NOT NULL CHECK (price_at_purchase_cents >= 0)
);

-- 8. Affiliates
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC(4,2) NOT NULL DEFAULT 0.10,
  total_earnings_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_earnings_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Reward Points
CREATE TABLE IF NOT EXISTS reward_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Site Settings
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dynamic banner & settings initial seed
INSERT INTO site_settings (key, value)
VALUES
  ('top_banner', '"Livraison offerte pour toute commande supérieure à 150 €"'::jsonb),
  ('free_shipping_threshold_cents', '15000'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS (Row Level Security) Configuration
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_sells ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Helper function for checking admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles can read own profile" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY "Admins full access to profiles" ON profiles FOR ALL USING (is_admin());

-- B2B Profiles Policies
CREATE POLICY "Users can read own b2b profile" ON b2b_profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can insert own b2b profile" ON b2b_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins full access to b2b_profiles" ON b2b_profiles FOR ALL USING (is_admin());

-- Categories Policies
CREATE POLICY "Categories are public readable" ON categories FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "Admins manage categories" ON categories FOR ALL USING (is_admin());

-- Products Policies
CREATE POLICY "Products are public readable" ON products FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage products" ON products FOR ALL USING (is_admin());

-- Cross Sells Policies
CREATE POLICY "Cross sells are public readable" ON cross_sells FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage cross sells" ON cross_sells FOR ALL USING (is_admin());

-- Orders Policies
CREATE POLICY "Users view own orders" ON orders FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users create orders" ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins manage orders" ON orders FOR ALL USING (is_admin());

-- Order Items Policies
CREATE POLICY "Users view own order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR is_admin())
  )
);
CREATE POLICY "Admins manage order items" ON order_items FOR ALL USING (is_admin());

-- Affiliates Policies
CREATE POLICY "Users view own affiliate status" ON affiliates FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admins manage affiliates" ON affiliates FOR ALL USING (is_admin());

-- Reward Points Policies
CREATE POLICY "Users view own reward points" ON reward_points FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admins manage reward points" ON reward_points FOR ALL USING (is_admin());

-- Audit Logs Policies
CREATE POLICY "Admins read audit logs" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins insert audit logs" ON audit_logs FOR INSERT WITH CHECK (is_admin());

-- Site Settings Policies
CREATE POLICY "Public read site settings" ON site_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage site settings" ON site_settings FOR ALL USING (is_admin());

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'client')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.reward_points (user_id, points_balance)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed Categories
INSERT INTO categories (id, name, slug, description, is_active)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Maroquinerie d''Exception', 'maroquinerie', 'Sacs, cabas et accessoires de voyage confectionnés en cuirs nobles.', TRUE),
  ('c0000000-0000-0000-0000-000000000002', 'Horlogerie & Joaillerie', 'horlogerie-joaillerie', 'Garde-temps de haute précision et parures d''or fin.', TRUE),
  ('c0000000-0000-0000-0000-000000000003', 'Services Conciergerie Privée', 'conciergerie', 'Accompagnement sur mesure et assistance VIP 7j/7.', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Seed Products
INSERT INTO products (id, title, slug, description, price_cents, currency, stock, is_featured, is_digital_service, images, metadata, category_id)
VALUES
  (
    'p0000000-0000-0000-0000-000000000001',
    'Sac Voyageur Grand Duc - Cuir Pleine Fleur',
    'sac-voyageur-grand-duc',
    'Confectionné à la main dans nos ateliers français, le Sac Voyageur Grand Duc allie élégance intemporelle et fonctionnalité moderne.',
    185000,
    'EUR',
    12,
    TRUE,
    FALSE,
    ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80'],
    '{"matiere": "Cuir de veau pleine fleur", "couleur": "Noir Profond", "origine": "France"}'::jsonb,
    'c0000000-0000-0000-0000-000000000001'
  ),
  (
    'p0000000-0000-0000-0000-000000000002',
    'Garde-Temps Chronographe L&M Édition Or',
    'garde-temps-chronographe-lm',
    'Mouvement automatique suisse, boîtier en or rosé 18k, verre saphir inrayable. Une pièce d''exception éditée en série limitée.',
    420000,
    'EUR',
    5,
    TRUE,
    FALSE,
    ARRAY['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'],
    '{"mouvement": "Automatique Suisse", "boitier": "Or rosé 18K", "etancheite": "50m"}'::jsonb,
    'c0000000-0000-0000-0000-000000000002'
  ),
  (
    'p0000000-0000-0000-0000-000000000003',
    'Portefeuille Héritage L&M - Dorure Fine',
    'portefeuille-heritage-lm',
    'Portefeuille compact en cuir d''agneau plongé, finitions rehaussées à la feuille d''or antique.',
    32000,
    'EUR',
    2,
    TRUE,
    FALSE,
    ARRAY['https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=80'],
    '{"matiere": "Cuir d''agneau", "couleur": "Noir / Or"}'::jsonb,
    'c0000000-0000-0000-0000-000000000001'
  ),
  (
    'p0000000-0000-0000-0000-000000000004',
    'Assistance Conciergerie Privée L&M (Pass 30 Jours)',
    'assistance-conciergerie-lm',
    'Accès prioritaire 24/7 à notre équipe de concierge dédié pour vos réservations et demandes personnalisées.',
    1500,
    'EUR',
    999,
    FALSE,
    TRUE,
    ARRAY['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'],
    '{"service": "Conciergerie Privée", "duree": "30 jours"}'::jsonb,
    'c0000000-0000-0000-0000-000000000003'
  )
ON CONFLICT (slug) DO NOTHING;

-- Seed Cross Sells
INSERT INTO cross_sells (product_id, recommended_product_id, discount_percentage)
VALUES
  ('p0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000004', 0.00),
  ('p0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000004', 0.00)
ON CONFLICT DO NOTHING;
