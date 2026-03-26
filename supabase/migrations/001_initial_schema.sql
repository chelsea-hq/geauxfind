-- GeauxFind: Initial Supabase Schema
-- Run via Supabase SQL Editor or supabase db push

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- PLACES (core — 742+ records from seed-data.json)
-- ============================================================
create table if not exists places (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  category text,
  cuisine text,                    -- single string in seed data, not array
  city text not null default 'Lafayette',
  rating numeric(2,1),
  price text,                      -- '$$', '$', etc.
  address text,
  phone text,
  website text,
  hours jsonb default '[]'::jsonb,
  description text,
  short_description text,
  image text,
  gallery text[] default '{}',
  tags text[] default '{}',
  smart_tags text[] default '{}',
  reviews jsonb default '[]'::jsonb,
  google_place_id text,
  google_maps_url text,
  photo_references text[] default '{}',
  price_level text,
  -- community signals
  community_rating numeric(3,2),
  community_review_count int default 0,
  -- flags
  is_featured boolean default false,
  is_verified boolean default false,
  -- meta
  source text,
  ai_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_places_city on places(city);
create index idx_places_category on places(category);
create index idx_places_slug on places(slug);

-- ============================================================
-- EVENTS
-- ============================================================
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  date date,
  end_date date,
  time text,
  venue text,
  address text,
  city text default 'Lafayette',
  description text,
  category text,
  image text,
  link text,
  source text,
  free boolean default false,
  price text,
  tags text[] default '{}',
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_events_date on events(date);

-- ============================================================
-- CAJUN CONNECTION: Businesses
-- ============================================================
create table if not exists cajun_businesses (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  short_description text,
  description text,
  category text,
  categories text[] default '{}',
  location text,
  website text,
  socials jsonb default '{}'::jsonb,
  logo text,
  cover_photo text,
  tags text[] default '{}',
  offerings text[] default '{}',
  featured boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- CAJUN CONNECTION: Fluencers
-- ============================================================
create table if not exists cajun_fluencers (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  short_description text,
  description text,
  category text,
  categories text[] default '{}',
  location text,
  platforms jsonb default '{}'::jsonb,
  avatar text,
  cover_photo text,
  tags text[] default '{}',
  specialties text[] default '{}',
  featured boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- COMMUNITY RECS (from FB dumps)
-- ============================================================
create table if not exists community_recs (
  id uuid primary key default uuid_generate_v4(),
  topic text not null,
  place_name text not null,
  slug text,
  mention_count int default 1,
  sample_quotes text[] default '{}',
  city text,
  source text default 'facebook',
  created_at timestamptz default now()
);

create index idx_community_recs_topic on community_recs(topic);

-- ============================================================
-- CRAWFISH PRICES
-- ============================================================
create table if not exists crawfish_prices (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  address text,
  city text default 'Lafayette',
  boiled_price_per_lb numeric(5,2),
  boiled_price_text text,
  live_price_per_lb numeric(5,2),
  live_price_text text,
  boiled_size text,
  live_size text,
  rating numeric(2,1),
  phone text,
  hours text,
  source text,
  source_updated_at timestamptz,
  fetched_at timestamptz default now()
);

-- ============================================================
-- LIVE MUSIC VENUES
-- ============================================================
create table if not exists live_music_venues (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  city text default 'Lafayette',
  address text,
  website text,
  facebook text,
  instagram text,
  music_nights jsonb default '[]'::jsonb,
  genres text[] default '{}',
  description text,
  place_id uuid references places(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- WHOS GOT IT (curated debates)
-- ============================================================
create table if not exists whos_got_it (
  id uuid primary key default uuid_generate_v4(),
  data jsonb not null,  -- stores the full structured JSON
  updated_at timestamptz default now()
);

-- ============================================================
-- KIDS EAT FREE
-- ============================================================
create table if not exists kids_eat_free (
  id uuid primary key default uuid_generate_v4(),
  data jsonb not null,
  updated_at timestamptz default now()
);

-- ============================================================
-- WEEKEND BRUNCH
-- ============================================================
create table if not exists weekend_brunch (
  id uuid primary key default uuid_generate_v4(),
  data jsonb not null,
  updated_at timestamptz default now()
);

-- ============================================================
-- DEALS / SUBMISSIONS
-- ============================================================
create table if not exists deals (
  id uuid primary key default uuid_generate_v4(),
  place_name text not null,
  place_slug text,
  deal_text text not null,
  category text,
  expires_at date,
  source text,
  verified boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- ALERT SUBSCRIPTIONS (newsletter signups)
-- ============================================================
create table if not exists alert_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  phone text,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- BUSINESS CLAIMS
-- ============================================================
create table if not exists business_claims (
  id uuid primary key default uuid_generate_v4(),
  place_slug text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  message text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- ============================================================
-- INTAKE DUMPS (raw FB paste processing)
-- ============================================================
create table if not exists intake_dumps (
  id uuid primary key default uuid_generate_v4(),
  raw_text text not null,
  source text,
  processed boolean default false,
  parsed_items jsonb,
  items_created int default 0,
  created_at timestamptz default now(),
  processed_at timestamptz
);

-- ============================================================
-- RECIPES
-- ============================================================
create table if not exists recipes (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  description text,
  category text,
  ingredients jsonb default '[]'::jsonb,
  instructions jsonb default '[]'::jsonb,
  prep_time text,
  cook_time text,
  servings int,
  difficulty text,
  cover_photo text,
  rating numeric(2,1),
  inspired_by text,
  is_featured boolean default false,
  tags text[] default '{}',
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- COMMUNITY SUBMISSIONS (cajun connection submit form)
-- ============================================================
create table if not exists community_submissions (
  id uuid primary key default uuid_generate_v4(),
  data jsonb not null,
  type text default 'business',  -- business, fluencer, general
  status text default 'pending',
  created_at timestamptz default now()
);

-- ============================================================
-- RLS POLICIES (anon read, service_role write)
-- ============================================================

-- Enable RLS on all tables
alter table places enable row level security;
alter table events enable row level security;
alter table cajun_businesses enable row level security;
alter table cajun_fluencers enable row level security;
alter table community_recs enable row level security;
alter table crawfish_prices enable row level security;
alter table live_music_venues enable row level security;
alter table whos_got_it enable row level security;
alter table kids_eat_free enable row level security;
alter table weekend_brunch enable row level security;
alter table deals enable row level security;
alter table alert_subscriptions enable row level security;
alter table business_claims enable row level security;
alter table intake_dumps enable row level security;
alter table recipes enable row level security;
alter table community_submissions enable row level security;

-- Public read for content tables
create policy "Public read places" on places for select using (true);
create policy "Public read events" on events for select using (true);
create policy "Public read cajun_businesses" on cajun_businesses for select using (true);
create policy "Public read cajun_fluencers" on cajun_fluencers for select using (true);
create policy "Public read community_recs" on community_recs for select using (true);
create policy "Public read crawfish_prices" on crawfish_prices for select using (true);
create policy "Public read live_music_venues" on live_music_venues for select using (true);
create policy "Public read whos_got_it" on whos_got_it for select using (true);
create policy "Public read kids_eat_free" on kids_eat_free for select using (true);
create policy "Public read weekend_brunch" on weekend_brunch for select using (true);
create policy "Public read deals" on deals for select using (true);
create policy "Public read recipes" on recipes for select using (true);

-- Public insert for user-facing forms
create policy "Public insert alert_subscriptions" on alert_subscriptions for insert with check (true);
create policy "Public insert business_claims" on business_claims for insert with check (true);
create policy "Public insert community_submissions" on community_submissions for insert with check (true);
