-- Maison L&M — Kennel / breeding showcase schema
-- Run this in the Supabase SQL Editor. Safe to rerun: it only creates what is
-- missing and never seeds any dog, breed, pedigree or price. All real content
-- is entered by an administrator from the back-office.
--
-- Public access is READ-ONLY and limited to published dogs. Every write
-- (create/edit a dog, read a reservation request) is reserved for staff roles
-- enforced by RLS. Reservation requests are inserted by the trusted server API
-- (service role), never directly by the browser, to avoid public spam writes.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. DOGS (puppies, breeders and adult dogs available for adoption)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  breed TEXT,
  -- 'puppy' (chiots) | 'breeder' (reproducteurs) | 'adult' (chiens adultes à placer)
  category TEXT NOT NULL DEFAULT 'puppy' CHECK (category IN ('puppy', 'breeder', 'adult')),
  sex TEXT CHECK (sex IS NULL OR sex IN ('male', 'female')),
  birth_date DATE,
  -- A NULL price_cents with price_on_request = true means "price on request".
  price_cents INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),
  price_on_request BOOLEAN NOT NULL DEFAULT false,
  -- 'available' (disponible) | 'reserved' (réservé) | 'adopted' (adopté)
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'adopted')),
  description TEXT,
  pedigree TEXT,
  health_tests TEXT,
  characteristics TEXT[] NOT NULL DEFAULT '{}',
  ideal_environment TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dogs
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS health_tests TEXT,
  ADD COLUMN IF NOT EXISTS ideal_environment TEXT;

CREATE INDEX IF NOT EXISTS dogs_published_status_idx
  ON public.dogs (is_published, status, sort_order DESC);
CREATE INDEX IF NOT EXISTS dogs_category_idx ON public.dogs (category);

-- ---------------------------------------------------------------------------
-- 2. RESERVATION / ADOPTION REQUESTS (written only by the trusted server API)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reservation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID REFERENCES public.dogs(id) ON DELETE SET NULL,
  dog_name TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  housing_type TEXT,
  has_garden BOOLEAN,
  has_children BOOLEAN,
  other_pets TEXT,
  -- 'new' | 'contacted' | 'closed'
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reservation_requests_status_idx
  ON public.reservation_requests (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published dogs" ON public.dogs;
DROP POLICY IF EXISTS "Staff read all dogs" ON public.dogs;
DROP POLICY IF EXISTS "Editor/SuperAdmin write dogs" ON public.dogs;
CREATE POLICY "Public read published dogs" ON public.dogs
  FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Editor/SuperAdmin write dogs" ON public.dogs
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS "Admins read reservation requests" ON public.reservation_requests;
CREATE POLICY "Admins read reservation requests" ON public.reservation_requests
  FOR SELECT USING (public.is_admin());
-- No INSERT/UPDATE policy for the browser: the /api/reservations route inserts
-- rows with the service role key after validating and rate-limiting the payload.

-- ---------------------------------------------------------------------------
-- 4. GRANTS
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.dogs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.dogs TO authenticated;
GRANT SELECT ON public.reservation_requests TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

COMMIT;
