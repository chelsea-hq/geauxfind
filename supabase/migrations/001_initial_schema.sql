-- GeauxFind initial schema
-- Run this against your Supabase project via the SQL editor or `supabase db push`

-- ─────────────────────────────────────────────────────────────────────────────
-- USER PROFILES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,

  -- Contribution stats (updated by triggers or application logic)
  review_count INT NOT NULL DEFAULT 0,
  recipe_count INT NOT NULL DEFAULT 0,
  tip_count INT NOT NULL DEFAULT 0,
  reputation_score INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Automatically create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- PLACES (restaurants, venues, markets, food trucks, etc.)
-- Matches cajun-connection.json, cajun-connection-expansion.json,
-- whos-got-it.json contenders, and community-recs.json businesses
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'restaurant', -- 'restaurant' | 'venue' | 'market' | 'bar' | 'food_truck' | 'specialty'
  cuisine TEXT[],                           -- ['cajun', 'seafood', 'bbq']
  description TEXT,
  short_description TEXT,
  address TEXT,
  city TEXT NOT NULL DEFAULT 'Lafayette',
  zip TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  website TEXT,
  hours JSONB,                              -- { "mon": "11:00-21:00", ... }
  price_range INT CHECK (price_range BETWEEN 1 AND 4),

  -- Third-party ratings
  google_rating NUMERIC(2,1),
  google_review_count INT,
  yelp_rating NUMERIC(2,1),
  yelp_review_count INT,

  -- GeauxFind community ratings
  community_rating NUMERIC(3,2),
  community_review_count INT NOT NULL DEFAULT 0,

  -- External IDs for enrichment pipelines
  google_place_id TEXT,
  yelp_id TEXT,

  -- Media
  cover_photo TEXT,
  photos TEXT[],

  -- Extended metadata from cajun-connection and community data
  categories TEXT[],                        -- secondary category list
  offerings TEXT[],                         -- what they sell/serve
  socials JSONB,                            -- { "facebook": "...", "instagram": "..." }
  tags TEXT[],                              -- ['crawfish', 'live-music', 'featured']

  -- Admin flags
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,

  -- Provenance
  source TEXT,                              -- 'google' | 'yelp' | 'cajun_connection' | 'community' | 'chelsea_dump'
  ai_summary TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_places_city     ON places(city);
CREATE INDEX IF NOT EXISTS idx_places_type     ON places(type);
CREATE INDEX IF NOT EXISTS idx_places_tags     ON places USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_places_cuisine  ON places USING GIN(cuisine);
CREATE INDEX IF NOT EXISTS idx_places_slug     ON places(slug);
CREATE INDEX IF NOT EXISTS idx_places_featured ON places(is_featured) WHERE is_featured = true;

-- Full-text search vector
ALTER TABLE places
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(short_description, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '') || ' ' ||
      coalesce(array_to_string(cuisine, ' '), '') || ' ' ||
      coalesce(city, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_places_fts ON places USING GIN(fts);

-- Keep updated_at current
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE TRIGGER places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- EVENTS (festivals, cook-offs, live music, markets, community)
-- Matches events.json structure (Eventbrite, do337, lafayette-travel, etc.)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'community',   -- 'festival' | 'cookoff' | 'music' | 'market' | 'community' | 'nightlife'
  description TEXT,

  -- Timing (dates stored as text to preserve partial data like "TBA")
  start_date DATE NOT NULL,
  end_date DATE,
  time TEXT,                                -- "7:00 PM" or "TBA"
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,                     -- iCal RRULE

  -- Location
  venue TEXT,
  address TEXT,
  city TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,

  -- Ticketing / cost
  price TEXT,                               -- 'Free', '$10', '$5-20'
  free BOOLEAN,
  ticket_url TEXT,
  website TEXT,
  source_url TEXT,

  -- Rich content
  lineup TEXT[],                            -- artist/performer names
  food_vendors TEXT[],
  cover_photo TEXT,
  photos TEXT[],

  -- Admin
  is_featured BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[],

  -- Provenance
  source TEXT,                              -- 'eventbrite' | 'do337' | 'lafayette_travel' | 'community' | 'chelsea_dump'

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_start    ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_type     ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_city     ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured) WHERE is_featured = true;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(venue, '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '') || ' ' ||
      coalesce(city, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_events_fts ON events USING GIN(fts);

CREATE OR REPLACE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- RECIPES ("What to Put")
-- Matches recipe-submissions.json structure
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,                            -- 'cajun' | 'creole' | 'dessert' | 'seafood' | 'sides'

  ingredients JSONB NOT NULL DEFAULT '[]',  -- [{ "item": "crawfish tails", "amount": "1 lb" }]
  instructions JSONB NOT NULL DEFAULT '[]', -- [{ "step": 1, "text": "Make a roux..." }]
  prep_time INT,                            -- minutes
  cook_time INT,                            -- minutes
  servings INT,
  difficulty TEXT,                          -- 'easy' | 'medium' | 'hard'

  -- Media
  cover_photo TEXT,
  photos TEXT[],
  video_url TEXT,

  -- Community
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  community_rating NUMERIC(3,2),
  rating_count INT NOT NULL DEFAULT 0,

  -- AI
  ai_tips TEXT,
  inspired_by UUID REFERENCES places(id) ON DELETE SET NULL,

  -- Admin
  is_featured BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[],

  -- Provenance
  source TEXT,                              -- 'community' | 'chelsea_dump' | 'ai_generated'

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_tags     ON recipes USING GIN(tags);

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_recipes_fts ON recipes USING GIN(fts);

CREATE OR REPLACE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- REVIEWS / TIPS (community contributions)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  rating INT CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  photos TEXT[],
  recommended_dishes TEXT[],

  upvotes INT NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_place  ON reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_author ON reviews(author_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- BEST OF LISTS (community-recs.json + whos-got-it.json)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS best_of_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                       -- "Best Crawfish in Acadiana"
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,                    -- 'food' | 'music' | 'events' | 'nightlife'
  description TEXT,

  -- Ordered entries — mixed format to support both community-recs and whos-got-it
  -- community-recs: [{ "slug": "...", "name": "...", "mentionCount": 47 }]
  -- whos-got-it:    [{ "slug": "...", "name": "...", "badge": "👑", "caseFor": "...", "rating": 4.7 }]
  entries JSONB NOT NULL DEFAULT '[]',

  -- Stats (from source data)
  business_count INT,
  total_mentions INT,

  -- Methodology / source
  methodology TEXT,                          -- 'community_votes' | 'ai_curated' | 'facebook_dump'
  source TEXT,                               -- 'community_recs' | 'whos_got_it' | 'manual'
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_best_of_category ON best_of_lists(category);
CREATE INDEX IF NOT EXISTS idx_best_of_slug     ON best_of_lists(slug);


-- ─────────────────────────────────────────────────────────────────────────────
-- ASK ACADIANA (Q&A)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  question TEXT NOT NULL,

  ai_answer TEXT,
  ai_sources JSONB,                          -- [{ "place_id": "...", "reason": "..." }]

  answer_count INT NOT NULL DEFAULT 0,
  upvotes INT NOT NULL DEFAULT 0,

  tags TEXT[],

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  upvotes INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- INTAKE DUMPS (Chelsea's weekly Facebook paste)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS intake_dumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_text TEXT NOT NULL,
  source TEXT,                               -- 'discord' | 'telegram' | 'manual'

  processed BOOLEAN NOT NULL DEFAULT false,
  parsed_items JSONB,
  items_created INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);


-- ─────────────────────────────────────────────────────────────────────────────
-- CRAWFISH PRICES (crawfish-prices.json — The Crawfish App data)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crawfish_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,

  boiled_price_per_lb NUMERIC(5,2),
  boiled_price_text TEXT,
  live_price_per_lb NUMERIC(5,2),
  live_price_text TEXT,
  boiled_size TEXT,
  live_size TEXT,

  rating NUMERIC(2,1),
  phone TEXT,
  hours TEXT,

  source TEXT NOT NULL DEFAULT 'crawfish_app',
  source_updated_at TEXT,                    -- raw string from source e.g. "03/19/2026 06:43 PM CST"

  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crawfish_city      ON crawfish_prices(city);
CREATE INDEX IF NOT EXISTS idx_crawfish_fetched   ON crawfish_prices(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawfish_boil_price ON crawfish_prices(boiled_price_per_lb) WHERE boiled_price_per_lb IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- LIVE MUSIC VENUES (live-music.json)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS live_music_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Lafayette',
  address TEXT,
  website TEXT,
  facebook TEXT,
  instagram TEXT,

  -- Weekly schedule: [{ "day": "Friday", "dayIndex": 5, "description": "Live Music", "hours": "Evening", "genre": "Various" }]
  music_nights JSONB NOT NULL DEFAULT '[]',

  -- Aggregated genres for filtering
  genres TEXT[],
  description TEXT,

  -- Optional link back to the places table
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_music_city ON live_music_venues(city);

CREATE OR REPLACE TRIGGER live_music_venues_updated_at
  BEFORE UPDATE ON live_music_venues
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
