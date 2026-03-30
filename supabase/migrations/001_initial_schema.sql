-- GeauxFind initial schema
-- Includes core content tables, community tables, and newsletter subscribers

create extension if not exists pgcrypto;

-- =====================================================
-- Helpers
-- =====================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================
-- Tables
-- =====================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  city text,
  review_count integer not null default 0,
  recipe_count integer not null default 0,
  tip_count integer not null default 0,
  reputation_score integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type text not null,
  cuisine text[],
  description text,
  short_description text,
  address text,
  city text not null default 'Lafayette',
  zip text,
  lat double precision,
  lng double precision,
  phone text,
  website text,
  hours jsonb,
  price_range integer,
  google_rating numeric(3,2),
  google_review_count integer,
  yelp_rating numeric(3,2),
  yelp_review_count integer,
  community_rating numeric(3,2),
  community_review_count integer not null default 0,
  google_place_id text,
  yelp_id text,
  cover_photo text,
  photos text[],
  is_featured boolean not null default false,
  is_verified boolean not null default false,
  tags text[],
  categories text[],
  offerings text[],
  socials jsonb,
  source text,
  ai_summary text,
  fts tsvector generated always as (
    to_tsvector(
      'english',
      concat_ws(' ', name, coalesce(description, ''), coalesce(city, ''), coalesce(array_to_string(tags, ' '), ''))
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type text not null,
  description text,
  start_date date not null,
  end_date date,
  time text,
  is_recurring boolean not null default false,
  recurrence_rule text,
  venue text,
  address text,
  city text,
  lat double precision,
  lng double precision,
  place_id uuid references public.places(id) on delete set null,
  price text,
  free boolean,
  ticket_url text,
  website text,
  lineup text[],
  food_vendors text[],
  cover_photo text,
  photos text[],
  is_featured boolean not null default false,
  tags text[],
  source text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  category text,
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  prep_time integer,
  cook_time integer,
  servings integer,
  difficulty text,
  cover_photo text,
  photos text[],
  video_url text,
  author_id uuid references public.profiles(id) on delete set null,
  community_rating numeric(3,2),
  rating_count integer not null default 0,
  ai_tips text,
  inspired_by text,
  is_featured boolean not null default false,
  tags text[],
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.places(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  rating numeric(3,2),
  text text,
  photos text[],
  recommended_dishes text[],
  upvotes integer not null default 0,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.best_of_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null,
  description text,
  entries jsonb not null default '[]'::jsonb,
  methodology text,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  question text not null,
  ai_answer text,
  ai_sources jsonb,
  answer_count integer not null default 0,
  upvotes integer not null default 0,
  tags text[],
  created_at timestamptz not null default now()
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  place_id uuid references public.places(id) on delete set null,
  upvotes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.intake_dumps (
  id uuid primary key default gen_random_uuid(),
  raw_text text not null,
  source text,
  processed boolean not null default false,
  parsed_items jsonb,
  items_created integer not null default 0,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.crawfish_prices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text,
  city text not null default 'Lafayette',
  boiled_price_per_lb numeric(8,2),
  boiled_price_text text,
  live_price_per_lb numeric(8,2),
  live_price_text text,
  boiled_size text,
  live_size text,
  rating numeric(3,2),
  phone text,
  hours text,
  source text not null default 'manual',
  source_updated_at timestamptz,
  fetched_at timestamptz not null default now()
);

create table if not exists public.live_music_venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text not null default 'Lafayette',
  address text,
  website text,
  facebook text,
  instagram text,
  music_nights jsonb not null default '[]'::jsonb,
  genres text[],
  description text,
  place_id uuid references public.places(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  source text not null default 'website',
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- =====================================================
-- Indexes
-- =====================================================
create index if not exists idx_places_slug on public.places(slug);
create index if not exists idx_places_city on public.places(city);
create index if not exists idx_places_created_at on public.places(created_at desc);
create index if not exists idx_places_fts on public.places using gin (fts);

create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_start_date on public.events(start_date);
create index if not exists idx_events_end_date on public.events(end_date);
create index if not exists idx_events_place_id on public.events(place_id);

create index if not exists idx_recipes_slug on public.recipes(slug);
create index if not exists idx_recipes_author_id on public.recipes(author_id);
create index if not exists idx_recipes_created_at on public.recipes(created_at desc);

create index if not exists idx_reviews_place_id on public.reviews(place_id);
create index if not exists idx_reviews_author_id on public.reviews(author_id);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);

create index if not exists idx_best_of_lists_slug on public.best_of_lists(slug);
create index if not exists idx_best_of_lists_last_updated on public.best_of_lists(last_updated desc);

create index if not exists idx_questions_created_at on public.questions(created_at desc);
create index if not exists idx_answers_question_id on public.answers(question_id);
create index if not exists idx_answers_place_id on public.answers(place_id);
create index if not exists idx_answers_author_id on public.answers(author_id);

create index if not exists idx_intake_dumps_created_at on public.intake_dumps(created_at desc);
create index if not exists idx_intake_dumps_processed on public.intake_dumps(processed);

create index if not exists idx_crawfish_prices_slug on public.crawfish_prices(slug);
create index if not exists idx_crawfish_prices_city on public.crawfish_prices(city);
create index if not exists idx_crawfish_prices_fetched_at on public.crawfish_prices(fetched_at desc);

create index if not exists idx_live_music_venues_slug on public.live_music_venues(slug);
create index if not exists idx_live_music_venues_place_id on public.live_music_venues(place_id);
create index if not exists idx_live_music_venues_city on public.live_music_venues(city);

create index if not exists idx_newsletter_subscribers_email on public.newsletter_subscribers(email);
create index if not exists idx_newsletter_subscribers_subscribed_at on public.newsletter_subscribers(subscribed_at desc);

-- =====================================================
-- updated_at triggers
-- =====================================================
drop trigger if exists trg_places_updated_at on public.places;
create trigger trg_places_updated_at
before update on public.places
for each row execute function public.set_updated_at();

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists trg_recipes_updated_at on public.recipes;
create trigger trg_recipes_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

drop trigger if exists trg_live_music_venues_updated_at on public.live_music_venues;
create trigger trg_live_music_venues_updated_at
before update on public.live_music_venues
for each row execute function public.set_updated_at();

-- =====================================================
-- RLS
-- =====================================================
alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.events enable row level security;
alter table public.recipes enable row level security;
alter table public.reviews enable row level security;
alter table public.best_of_lists enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.intake_dumps enable row level security;
alter table public.crawfish_prices enable row level security;
alter table public.live_music_venues enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- service role can do everything on all tables
create policy "profiles_service_role_all" on public.profiles for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "places_service_role_all" on public.places for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "events_service_role_all" on public.events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "recipes_service_role_all" on public.recipes for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "reviews_service_role_all" on public.reviews for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "best_of_lists_service_role_all" on public.best_of_lists for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "questions_service_role_all" on public.questions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "answers_service_role_all" on public.answers for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "intake_dumps_service_role_all" on public.intake_dumps for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "crawfish_prices_service_role_all" on public.crawfish_prices for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "live_music_venues_service_role_all" on public.live_music_venues for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "newsletter_subscribers_service_role_all" on public.newsletter_subscribers for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- anon read on public content tables
create policy "places_anon_read" on public.places for select to anon using (true);
create policy "events_anon_read" on public.events for select to anon using (true);
create policy "recipes_anon_read" on public.recipes for select to anon using (true);
create policy "crawfish_prices_anon_read" on public.crawfish_prices for select to anon using (true);
create policy "live_music_venues_anon_read" on public.live_music_venues for select to anon using (true);
create policy "best_of_lists_anon_read" on public.best_of_lists for select to anon using (true);

-- authenticated community access
create policy "reviews_authenticated_select" on public.reviews for select to authenticated using (true);
create policy "reviews_authenticated_insert" on public.reviews for insert to authenticated with check (auth.uid() = author_id);
create policy "reviews_authenticated_update_own" on public.reviews for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "questions_authenticated_select" on public.questions for select to authenticated using (true);
create policy "questions_authenticated_insert" on public.questions for insert to authenticated with check (auth.uid() = author_id or author_id is null);
create policy "questions_authenticated_update_own" on public.questions for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "answers_authenticated_select" on public.answers for select to authenticated using (true);
create policy "answers_authenticated_insert" on public.answers for insert to authenticated with check (auth.uid() = author_id);
create policy "answers_authenticated_update_own" on public.answers for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- profiles: authenticated users can view and manage their own profile
create policy "profiles_authenticated_select" on public.profiles for select to authenticated using (true);
create policy "profiles_authenticated_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_authenticated_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
