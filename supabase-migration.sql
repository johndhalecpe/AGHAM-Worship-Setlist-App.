ALTER TABLE songs ADD COLUMN IF NOT EXISTS lyrics TEXT DEFAULT '';
ALTER TABLE songs ADD COLUMN IF NOT EXISTS default_time_signature TEXT DEFAULT '4/4';
ALTER TABLE songs ADD COLUMN IF NOT EXISTS default_key TEXT DEFAULT 'G';
ALTER TABLE songs ADD COLUMN IF NOT EXISTS default_bpm INTEGER DEFAULT 120;

ALTER TABLE setlist_sections ADD COLUMN IF NOT EXISTS song_key TEXT DEFAULT NULL;
ALTER TABLE setlist_sections ADD COLUMN IF NOT EXISTS override_lyrics TEXT DEFAULT NULL;
ALTER TABLE setlist_sections ADD COLUMN IF NOT EXISTS chord_notes JSONB DEFAULT NULL;

ALTER TABLE songs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE songs ADD COLUMN IF NOT EXISTS chords TEXT DEFAULT NULL;

-- ============================================================
-- Admin approval system
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can update profiles" ON public.profiles;
CREATE POLICY "Admin can update profiles"
  ON public.profiles FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'johndhalecpe@setlist.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'johndhalecpe@setlist.com');

-- ============================================================
-- Songs RLS: only authenticated users can read/write
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can read songs" ON songs;
CREATE POLICY "Authenticated users can read songs"
  ON songs FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert songs" ON songs;
CREATE POLICY "Authenticated users can insert songs"
  ON songs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update songs" ON songs;
CREATE POLICY "Authenticated users can update songs"
  ON songs FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete songs" ON songs;
CREATE POLICY "Authenticated users can delete songs"
  ON songs FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Setlists RLS: only authenticated users can read/write
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can read setlists" ON setlists;
CREATE POLICY "Authenticated users can read setlists"
  ON setlists FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert setlists" ON setlists;
CREATE POLICY "Authenticated users can insert setlists"
  ON setlists FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update setlists" ON setlists;
CREATE POLICY "Authenticated users can update setlists"
  ON setlists FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete setlists" ON setlists;
CREATE POLICY "Authenticated users can delete setlists"
  ON setlists FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Setlist sections RLS: only authenticated users can read/write
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can read setlist_sections" ON setlist_sections;
CREATE POLICY "Authenticated users can read setlist_sections"
  ON setlist_sections FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert setlist_sections" ON setlist_sections;
CREATE POLICY "Authenticated users can insert setlist_sections"
  ON setlist_sections FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update setlist_sections" ON setlist_sections;
CREATE POLICY "Authenticated users can update setlist_sections"
  ON setlist_sections FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete setlist_sections" ON setlist_sections;
CREATE POLICY "Authenticated users can delete setlist_sections"
  ON setlist_sections FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Password resets table (forgot password flow)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  requested_password TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved BOOLEAN DEFAULT false
);

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Fix: requested_password should not be NOT NULL (forgot password flow sends null)
ALTER TABLE public.password_resets ALTER COLUMN requested_password DROP NOT NULL;

DROP POLICY IF EXISTS "Anyone can insert password_resets" ON public.password_resets;
CREATE POLICY "Anyone can insert password_resets"
  ON public.password_resets FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read password_resets" ON public.password_resets;
CREATE POLICY "Authenticated users can read password_resets"
  ON public.password_resets FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, status, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'singer'),
    CASE WHEN NEW.email = 'johndhalecpe@setlist.com' THEN 'approved' ELSE 'pending' END,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS: Users can insert their own profile (for upsert fallback)
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- RLS: Users can update their own profile (change name, etc.)
-- ============================================================
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- Backfill profiles for existing auth users who signed up
-- before the handle_new_user trigger was added.
-- ============================================================
INSERT INTO public.profiles (id, name, role, status, created_at, updated_at)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data ->> 'role', 'singer'),
  CASE WHEN u.email = 'johndhalecpe@setlist.com' THEN 'approved' ELSE 'pending' END,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Active users function (admin dashboard)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_active_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (s.user_id)
    s.user_id,
    u.email::TEXT,
    COALESCE(p.name, u.email::TEXT) AS name
  FROM auth.sessions s
  JOIN auth.users u ON u.id = s.user_id
  LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE s.not_after IS NULL OR s.not_after > now()
  ORDER BY s.user_id, s.updated_at DESC;
END;
$$;

-- ============================================================
-- All users function (admin dashboard - shows every registered user)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email::TEXT,
    COALESCE(p.name, u.email::TEXT) AS name
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
