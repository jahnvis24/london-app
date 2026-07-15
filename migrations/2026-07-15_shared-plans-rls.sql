-- Tighten shared_plans RLS: anyone can read (for share links), but only
-- authenticated users can insert/update their own plans.
DROP POLICY IF EXISTS "Public read" ON shared_plans;
DROP POLICY IF EXISTS "Public insert" ON shared_plans;
DROP POLICY IF EXISTS "Public update" ON shared_plans;

CREATE POLICY "Anyone can read shared plans"
  ON shared_plans FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert plans"
  ON shared_plans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update own plans"
  ON shared_plans FOR UPDATE
  USING (auth.uid() IS NOT NULL);
