-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom enum types (Enhanced Multi-Tier RBAC)
CREATE TYPE user_role AS ENUM ('customer', 'support', 'editor', 'super_admin');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper functions for Granular Multi-Tier Admin Roles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
DECLARE
  current_role user_role;
BEGIN
  SELECT role INTO current_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(current_role, 'customer'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role() IN ('support', 'editor', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_editor_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role() IN ('editor', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role() = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master Account Auto-Elevation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE
      WHEN NEW.email = 'admin@maison-lm.com' THEN 'super_admin'::user_role
      ELSE 'customer'::user_role
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE WHEN EXCLUDED.email = 'admin@maison-lm.com' THEN 'super_admin'::user_role ELSE public.profiles.role END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. AUDIT TRAIL LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g. 'PRODUCT_DELETE', 'ROLE_CHANGE', 'REFUND_ISSUED'
  target_resource TEXT NOT NULL, -- e.g. 'products', 'profiles', 'site_settings'
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SUPPLIERS / VENDORS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  shipping_delay_days INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CATEGORIES TABLE (3-Level Hierarchy)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT 'Package',
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ATTRIBUTES & ATTRIBUTE VALUES TABLES
CREATE TABLE IF NOT EXISTS public.attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attribute_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attribute_id UUID NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PRODUCTS TABLE (Full Admin Columns, Promotions & CRO Thresholds)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  sale_price_cents INTEGER CHECK (sale_price_cents IS NULL OR sale_price_cents >= 0),
  sale_ends_at TIMESTAMPTZ,
  cost_price_cents INTEGER CHECK (cost_price_cents IS NULL OR cost_price_cents >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INTEGER DEFAULT 3,
  images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  title TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  sale_price_cents INTEGER CHECK (sale_price_cents IS NULL OR sale_price_cents >= 0),
  cost_price_cents INTEGER CHECK (cost_price_cents IS NULL OR cost_price_cents >= 0),
  price_override_cents INTEGER CHECK (price_override_cents IS NULL OR price_override_cents >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  attributes JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CURRENCIES & TAX RATES TABLES
CREATE TABLE IF NOT EXISTS public.currencies (
  code TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  exchange_rate NUMERIC(10,4) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tax_rates (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  rate_percent NUMERIC(5,2) NOT NULL DEFAULT 20.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SITE SETTINGS & CONVERSION CONFIG TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY, -- 'main_config' or 'conversion_config'
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ORDERS & ORDER ITEMS TABLES
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'pending',
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  shipping_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Profiles Policy: Users read own or SuperAdmin full access
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "SuperAdmin modify profiles" ON public.profiles FOR ALL USING (public.is_super_admin());

-- Audit Logs Policy
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin());

-- Public READ for active rows, Granular RBAC for mutations
CREATE POLICY "Public read active suppliers" ON public.suppliers FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Editor/SuperAdmin full access suppliers" ON public.suppliers FOR ALL USING (public.is_editor_or_above());

CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Editor/SuperAdmin full access categories" ON public.categories FOR ALL USING (public.is_editor_or_above());

CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Editor/SuperAdmin full access products" ON public.products FOR ALL USING (public.is_editor_or_above());

CREATE POLICY "Public read active product variants" ON public.product_variants FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Editor/SuperAdmin full access product variants" ON public.product_variants FOR ALL USING (public.is_editor_or_above());

CREATE POLICY "Public read currencies" ON public.currencies FOR SELECT USING (true);
CREATE POLICY "SuperAdmin full access currencies" ON public.currencies FOR ALL USING (public.is_super_admin());

CREATE POLICY "Public read tax rates" ON public.tax_rates FOR SELECT USING (true);
CREATE POLICY "SuperAdmin full access tax rates" ON public.tax_rates FOR ALL USING (public.is_super_admin());

CREATE POLICY "Public read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "SuperAdmin full access site settings" ON public.site_settings FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users view own orders or admin" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Support/Editor/SuperAdmin update orders" ON public.orders FOR ALL USING (public.is_admin());
