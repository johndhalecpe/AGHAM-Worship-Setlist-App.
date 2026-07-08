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
