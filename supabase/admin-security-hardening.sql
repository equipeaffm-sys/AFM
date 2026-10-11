BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'customer'::user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  users.id,
  users.email,
  users.raw_user_meta_data->>'full_name',
  'customer'::user_role
FROM auth.users AS users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

-- Existing staff roles are preserved to avoid locking out the current owner.
-- Review legacy super_admin accounts manually after granting access to the verified owner.

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "SuperAdmin modify profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own or admins read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile without role changes" ON public.profiles;
DROP POLICY IF EXISTS "SuperAdmin update profiles" ON public.profiles;

CREATE POLICY "Users read own or admins read profiles" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Users update own profile without role changes" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = public.get_user_role());
CREATE POLICY "SuperAdmin update profiles" ON public.profiles
  FOR UPDATE USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Users view own order items or admin" ON public.order_items;
CREATE POLICY "Users view own order items or admin" ON public.order_items
  FOR SELECT USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

COMMIT;
