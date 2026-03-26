-- Row Level Security policies for GeauxFind
-- Strategy: public read on all content; writes require auth; service role bypasses all.

-- ─── PLACES ─────────────────────────────────────────────────────────────────

ALTER TABLE places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "places_public_read" ON places
  FOR SELECT USING (true);

CREATE POLICY "places_service_write" ON places
  FOR ALL USING (auth.role() = 'service_role');


-- ─── EVENTS ─────────────────────────────────────────────────────────────────

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_read" ON events
  FOR SELECT USING (true);

CREATE POLICY "events_service_write" ON events
  FOR ALL USING (auth.role() = 'service_role');


-- ─── RECIPES ────────────────────────────────────────────────────────────────

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipes_public_read" ON recipes
  FOR SELECT USING (true);

CREATE POLICY "recipes_users_create" ON recipes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

CREATE POLICY "recipes_users_edit_own" ON recipes
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "recipes_service_write" ON recipes
  FOR ALL USING (auth.role() = 'service_role');


-- ─── REVIEWS ────────────────────────────────────────────────────────────────

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_users_create" ON reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

CREATE POLICY "reviews_users_edit_own" ON reviews
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "reviews_service_write" ON reviews
  FOR ALL USING (auth.role() = 'service_role');


-- ─── PROFILES ───────────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_users_edit_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_service_write" ON profiles
  FOR ALL USING (auth.role() = 'service_role');


-- ─── BEST OF LISTS ──────────────────────────────────────────────────────────

ALTER TABLE best_of_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "best_of_lists_public_read" ON best_of_lists
  FOR SELECT USING (true);

CREATE POLICY "best_of_lists_service_write" ON best_of_lists
  FOR ALL USING (auth.role() = 'service_role');


-- ─── QUESTIONS ──────────────────────────────────────────────────────────────

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_public_read" ON questions
  FOR SELECT USING (true);

CREATE POLICY "questions_users_create" ON questions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "questions_service_write" ON questions
  FOR ALL USING (auth.role() = 'service_role');


-- ─── ANSWERS ────────────────────────────────────────────────────────────────

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "answers_public_read" ON answers
  FOR SELECT USING (true);

CREATE POLICY "answers_users_create" ON answers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

CREATE POLICY "answers_users_edit_own" ON answers
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "answers_service_write" ON answers
  FOR ALL USING (auth.role() = 'service_role');


-- ─── CRAWFISH PRICES ────────────────────────────────────────────────────────

ALTER TABLE crawfish_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crawfish_prices_public_read" ON crawfish_prices
  FOR SELECT USING (true);

CREATE POLICY "crawfish_prices_service_write" ON crawfish_prices
  FOR ALL USING (auth.role() = 'service_role');


-- ─── LIVE MUSIC VENUES ──────────────────────────────────────────────────────

ALTER TABLE live_music_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_music_venues_public_read" ON live_music_venues
  FOR SELECT USING (true);

CREATE POLICY "live_music_venues_service_write" ON live_music_venues
  FOR ALL USING (auth.role() = 'service_role');


-- ─── INTAKE DUMPS ───────────────────────────────────────────────────────────
-- No public read — dumps may contain raw unprocessed community text

ALTER TABLE intake_dumps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intake_dumps_service_only" ON intake_dumps
  FOR ALL USING (auth.role() = 'service_role');
