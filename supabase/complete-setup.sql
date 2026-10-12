-- L&M Supabase setup
-- Run this whole file in the Supabase SQL Editor for the project's database.
-- Safe to rerun on a database that already uses the current L&M schema: it
-- preserves existing products, categories, customer profiles, orders, and staff roles.
-- It intentionally creates no demo products, demo categories, or admin account.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type AS types
    JOIN pg_namespace AS namespaces ON namespaces.oid = types.typnamespace
    WHERE namespaces.nspname = 'public'
      AND types.typname = 'user_role'
      AND types.typtype = 'e'
  ) AND (
    SELECT COUNT(DISTINCT labels.enumlabel)
    FROM pg_enum AS labels
    JOIN pg_type AS types ON types.oid = labels.enumtypid
    JOIN pg_namespace AS namespaces ON namespaces.oid = types.typnamespace
    WHERE namespaces.nspname = 'public'
      AND types.typname = 'user_role'
      AND labels.enumlabel IN ('customer', 'support', 'editor', 'super_admin')
  ) < 4 THEN
    RAISE EXCEPTION
      'This database has an incompatible legacy user_role enum. Stop here and migrate it separately; no changes were committed.';
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM pg_attribute AS columns
      WHERE columns.attrelid = to_regclass('public.profiles')
        AND columns.attname = 'role'
        AND columns.attnum > 0
        AND NOT columns.attisdropped
        AND columns.atttypid IS DISTINCT FROM to_regtype('public.user_role')
    )
  THEN
    RAISE EXCEPTION
      'The existing profiles.role column does not use the current L&M role type. Stop here and migrate it separately; no changes were committed.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_type AS types
    JOIN pg_namespace AS namespaces ON namespaces.oid = types.typnamespace
    WHERE namespaces.nspname = 'public'
      AND types.typname = 'order_status'
      AND types.typtype = 'e'
  ) AND (
    SELECT COUNT(DISTINCT labels.enumlabel)
    FROM pg_enum AS labels
    JOIN pg_type AS types ON types.oid = labels.enumtypid
    JOIN pg_namespace AS namespaces ON namespaces.oid = types.typnamespace
    WHERE namespaces.nspname = 'public'
      AND types.typname = 'order_status'
      AND labels.enumlabel IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')
  ) < 5 THEN
    RAISE EXCEPTION
      'This database has an incompatible legacy order_status enum. Stop here and migrate it separately; no changes were committed.';
  END IF;

  IF to_regclass('public.orders') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM pg_attribute AS columns
      WHERE columns.attrelid = to_regclass('public.orders')
        AND columns.attname = 'status'
        AND columns.attnum > 0
        AND NOT columns.attisdropped
        AND columns.atttypid IS DISTINCT FROM to_regtype('public.order_status')
    )
  THEN
    RAISE EXCEPTION
      'The existing orders.status column does not use the current L&M order type. Stop here and migrate it separately; no changes were committed.';
  END IF;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('customer', 'support', 'editor', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT profiles.role FROM public.profiles AS profiles WHERE profiles.id = auth.uid()),
    'customer'::public.user_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.get_user_role() IN ('support', 'editor', 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_editor_or_above()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.get_user_role() IN ('editor', 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.get_user_role() = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'customer'::public.user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  users.id,
  users.email,
  users.raw_user_meta_data->>'full_name',
  'customer'::public.user_role
FROM auth.users AS users
WHERE users.email IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

UPDATE public.profiles
SET email = users.email
FROM auth.users AS users
WHERE public.profiles.id = users.id
  AND public.profiles.email IS NULL
  AND users.email IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  shipping_delay_days INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT 'Package',
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attribute_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (attribute_id, code)
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  sale_price_cents INTEGER CHECK (sale_price_cents IS NULL OR sale_price_cents >= 0),
  sale_ends_at TIMESTAMPTZ,
  cost_price_cents INTEGER CHECK (cost_price_cents IS NULL OR cost_price_cents >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
  images TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sale_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS sale_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cost_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  title TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  sale_price_cents INTEGER CHECK (sale_price_cents IS NULL OR sale_price_cents >= 0),
  cost_price_cents INTEGER CHECK (cost_price_cents IS NULL OR cost_price_cents >= 0),
  price_override_cents INTEGER CHECK (price_override_cents IS NULL OR price_override_cents >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  rate_percent NUMERIC(5,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tax rules are decided per country by an administrator. There is deliberately
-- no default rate: a NULL rate_percent means the tax treatment for that country
-- is not decided yet, and checkout refuses to serve such a country.
ALTER TABLE public.tax_rates
  ALTER COLUMN rate_percent DROP DEFAULT;
ALTER TABLE public.tax_rates
  ALTER COLUMN rate_percent DROP NOT NULL;
ALTER TABLE public.tax_rates
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Shipping zones group served countries (France / Europe outside France /
-- International). No zone is seeded: each starts inactive and unconfigured, and
-- the owner fills real carrier names, Stripe rate ids and country lists from the
-- admin UI. Checkout stays disabled until every active zone has a valid rule.
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_key TEXT NOT NULL UNIQUE
    CHECK (zone_key IN ('france', 'europe', 'international')),
  label TEXT NOT NULL,
  countries TEXT[] NOT NULL DEFAULT '{}',
  carrier_name TEXT,
  fee_cents INTEGER CHECK (fee_cents IS NULL OR fee_cents >= 0),
  free_threshold_cents INTEGER CHECK (free_threshold_cents IS NULL OR free_threshold_cents >= 0),
  stripe_shipping_rate_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  shipping_address JSONB,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_active_created_at_idx
  ON public.products (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS products_category_id_idx
  ON public.products (category_id);
CREATE INDEX IF NOT EXISTS product_variants_product_id_idx
  ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS orders_user_id_created_at_idx
  ON public.orders (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_session_id_idx
  ON public.orders (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS order_items_order_id_idx
  ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
  ON public.audit_logs (created_at DESC);

CREATE OR REPLACE FUNCTION public.create_pending_checkout_order(
  p_user_id UUID,
  p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  created_order_id UUID;
  requested_item RECORD;
  product_record public.products%ROWTYPE;
  item_price_cents INTEGER;
  order_total_cents BIGINT := 0;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'The checkout cart must be a JSON array.';
  END IF;
  IF jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'The checkout cart is empty or too large.';
  END IF;

  INSERT INTO public.orders (user_id, status, total_cents)
  VALUES (p_user_id, 'pending', 0)
  RETURNING id INTO created_order_id;

  FOR requested_item IN
    SELECT item.product_id, SUM(item.quantity)::INTEGER AS quantity
    FROM jsonb_to_recordset(p_items) AS item(product_id UUID, quantity INTEGER)
    GROUP BY item.product_id
  LOOP
    IF requested_item.product_id IS NULL
      OR requested_item.quantity < 1
      OR requested_item.quantity > 99
    THEN
      RAISE EXCEPTION 'A checkout item is invalid.';
    END IF;

    SELECT *
      INTO product_record
      FROM public.products
      WHERE id = requested_item.product_id
        AND is_active = TRUE
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product is no longer available.';
    END IF;
    IF product_record.stock < requested_item.quantity THEN
      RAISE EXCEPTION 'A product does not have enough stock.';
    END IF;

    item_price_cents := CASE
      WHEN product_record.sale_price_cents IS NOT NULL
        AND (
          product_record.sale_ends_at IS NULL
          OR product_record.sale_ends_at > NOW()
        )
      THEN product_record.sale_price_cents
      ELSE product_record.price_cents
    END;
    IF item_price_cents <= 0 THEN
      RAISE EXCEPTION 'Products must have a positive price to use online checkout.';
    END IF;

    order_total_cents := order_total_cents
      + (item_price_cents::BIGINT * requested_item.quantity);

    IF order_total_cents > 2147483647 THEN
      RAISE EXCEPTION 'The checkout total exceeds the supported limit.';
    END IF;

    UPDATE public.products
      SET stock = stock - requested_item.quantity,
          updated_at = NOW()
      WHERE id = requested_item.product_id;

    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price_cents)
    VALUES (
      created_order_id,
      requested_item.product_id,
      requested_item.quantity,
      item_price_cents
    );
  END LOOP;

  UPDATE public.orders
    SET total_cents = order_total_cents::INTEGER,
        updated_at = NOW()
    WHERE id = created_order_id;

  RETURN created_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_pending_checkout_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  released_order_id UUID;
  ordered_item RECORD;
BEGIN
  UPDATE public.orders
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_order_id
      AND status = 'pending'
    RETURNING id INTO released_order_id;

  IF released_order_id IS NULL THEN
    RETURN FALSE;
  END IF;

  FOR ordered_item IN
    SELECT product_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
  LOOP
    UPDATE public.products
      SET stock = stock + ordered_item.quantity,
          updated_at = NOW()
      WHERE id = ordered_item.product_id;
  END LOOP;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.create_pending_checkout_order(UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_pending_checkout_order(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_pending_checkout_order(UUID, JSONB)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.release_pending_checkout_order(UUID)
  TO service_role;

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
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Replace the project's known policy names so this setup can be safely rerun
-- and old permissive profile policies do not keep exposing customer records.
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "SuperAdmin modify profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own or admins read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile without role changes" ON public.profiles;
DROP POLICY IF EXISTS "SuperAdmin update profiles" ON public.profiles;
CREATE POLICY "Users read own or admins read profiles" ON public.profiles
  FOR SELECT USING (id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY "Users update own profile without role changes" ON public.profiles
  FOR UPDATE USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()) AND role = public.get_user_role());
CREATE POLICY "SuperAdmin update profiles" ON public.profiles
  FOR UPDATE USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read active suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Editor/SuperAdmin full access suppliers" ON public.suppliers;
CREATE POLICY "Public read active suppliers" ON public.suppliers
  FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Editor/SuperAdmin full access suppliers" ON public.suppliers
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Categories are public readable" ON public.categories;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "Editor/SuperAdmin full access categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Editor/SuperAdmin full access categories" ON public.categories
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS "Public read attributes" ON public.attributes;
DROP POLICY IF EXISTS "Editor/SuperAdmin full access attributes" ON public.attributes;
CREATE POLICY "Public read attributes" ON public.attributes
  FOR SELECT USING (true);
CREATE POLICY "Editor/SuperAdmin full access attributes" ON public.attributes
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS "Public read attribute values" ON public.attribute_values;
DROP POLICY IF EXISTS "Editor/SuperAdmin full access attribute values" ON public.attribute_values;
CREATE POLICY "Public read attribute values" ON public.attribute_values
  FOR SELECT USING (true);
CREATE POLICY "Editor/SuperAdmin full access attribute values" ON public.attribute_values
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS "Public read active products" ON public.products;
DROP POLICY IF EXISTS "Products are public readable" ON public.products;
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
DROP POLICY IF EXISTS "Editor/SuperAdmin full access products" ON public.products;
CREATE POLICY "Public read active products" ON public.products
  FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Editor/SuperAdmin full access products" ON public.products
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS "Public read active product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Editor/SuperAdmin full access product variants" ON public.product_variants;
CREATE POLICY "Public read active product variants" ON public.product_variants
  FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Editor/SuperAdmin full access product variants" ON public.product_variants
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS "Public read currencies" ON public.currencies;
DROP POLICY IF EXISTS "SuperAdmin full access currencies" ON public.currencies;
CREATE POLICY "Public read currencies" ON public.currencies
  FOR SELECT USING (true);
CREATE POLICY "SuperAdmin full access currencies" ON public.currencies
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Public read tax rates" ON public.tax_rates;
DROP POLICY IF EXISTS "SuperAdmin full access tax rates" ON public.tax_rates;
CREATE POLICY "Public read tax rates" ON public.tax_rates
  FOR SELECT USING (true);
CREATE POLICY "SuperAdmin full access tax rates" ON public.tax_rates
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Public read shipping zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "SuperAdmin full access shipping zones" ON public.shipping_zones;
CREATE POLICY "Public read shipping zones" ON public.shipping_zones
  FOR SELECT USING (true);
CREATE POLICY "SuperAdmin full access shipping zones" ON public.shipping_zones
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Public read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
DROP POLICY IF EXISTS "SuperAdmin full access site settings" ON public.site_settings;
CREATE POLICY "Public read site settings" ON public.site_settings
  FOR SELECT USING (true);
CREATE POLICY "SuperAdmin full access site settings" ON public.site_settings
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Users view own orders or admin" ON public.orders;
DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users create orders" ON public.orders;
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
DROP POLICY IF EXISTS "Support/Editor/SuperAdmin update orders" ON public.orders;
CREATE POLICY "Users view own orders or admin" ON public.orders
  FOR SELECT USING (user_id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY "Support/Editor/SuperAdmin update orders" ON public.orders
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users view own order items or admin" ON public.order_items;
DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins manage order items" ON public.order_items;
CREATE POLICY "Users view own order items or admin" ON public.order_items
  FOR SELECT USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_items.order_id
        AND public.orders.user_id = (SELECT auth.uid())
    )
  );

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.categories, public.attributes, public.attribute_values,
  public.currencies, public.tax_rates, public.site_settings,
  public.shipping_zones TO anon, authenticated;
GRANT SELECT ON public.suppliers TO anon, authenticated;
GRANT SELECT ON public.products, public.product_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories, public.attributes,
  public.attribute_values, public.suppliers, public.products, public.product_variants
  TO authenticated;
REVOKE UPDATE ON TABLE public.profiles FROM anon, authenticated;
REVOKE INSERT, DELETE ON TABLE public.profiles, public.orders, public.order_items
  FROM anon, authenticated;
GRANT SELECT ON public.profiles, public.orders, public.order_items TO authenticated;
GRANT UPDATE (full_name, updated_at, role) ON public.profiles TO authenticated;
GRANT UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings, public.currencies, public.tax_rates,
  public.shipping_zones
  TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_editor_or_above() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated;

-- The bucket is public for image display; uploads and deletes remain staff-only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Supabase manages ownership and RLS on storage.objects. Try to install the
-- object policies, but do not abort all public-schema setup if this SQL Editor
-- role is not allowed to manage the Storage-owned table. In that case, add the
-- same policies from Dashboard > Storage > Policies (instructions in ADMIN_SETUP.md).
DO $storage_policies$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Public can view product images" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Staff can upload product images" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Staff can update product images" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Staff can delete product images" ON storage.objects';
  EXECUTE 'CREATE POLICY "Public can view product images" ON storage.objects
    FOR SELECT USING (bucket_id = ''product-images'')';
  EXECUTE 'CREATE POLICY "Staff can upload product images" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = ''product-images'' AND public.is_editor_or_above())';
  EXECUTE 'CREATE POLICY "Staff can update product images" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = ''product-images'' AND public.is_editor_or_above())
    WITH CHECK (bucket_id = ''product-images'' AND public.is_editor_or_above())';
  EXECUTE 'CREATE POLICY "Staff can delete product images" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = ''product-images'' AND public.is_editor_or_above())';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'Storage policies were not changed because this SQL Editor role does not own storage.objects. Finish the Storage > Policies steps in supabase/ADMIN_SETUP.md.';
END
$storage_policies$;

COMMIT;

-- After signing up and signing in to your own account, grant yourself admin access
-- separately in the SQL Editor. Replace the email and verify the returned row:
--
-- UPDATE public.profiles AS profiles
-- SET role = 'super_admin'
-- FROM auth.users AS users
-- WHERE profiles.id = users.id
--   AND lower(users.email) = lower('YOUR_OWN_EMAIL')
-- RETURNING profiles.id, profiles.email, profiles.role;
--
-- No customer order INSERT policy is enabled. The prepared checkout creates orders through
-- trusted server-side functions and never accepts browser-supplied totals.

-- Optional read-only checks after the setup has completed:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'profiles', 'categories', 'products', 'product_variants',
--     'orders', 'order_items', 'site_settings', 'audit_logs'
--   )
-- ORDER BY tablename;
--
-- SELECT id, public, file_size_limit, allowed_mime_types
-- FROM storage.buckets
-- WHERE id = 'product-images';
