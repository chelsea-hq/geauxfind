# GeauxFind — Technical Requirements Document
*Version 1.0 | March 24, 2026*
*Author: Luna (AI) | Owner: Chelsea H / CH Tech Ventures LLC*

---

## 1. Executive Summary

**GeauxFind** is an AI-curated local discovery hub for Acadiana (Lafayette, Broussard, Scott, Youngsville, and surrounding areas). It combines community-contributed insights with automated data pipelines to create the definitive resource for food, festivals, live music, recipes, and local finds in Cajun country.

**Tagline:** *Find the best of Acadiana*

**Problem:** Local knowledge is trapped in Facebook groups (Foodies of Acadiana, etc.) — unsearchable, unstructured, ephemeral. There's no modern, centralized place to find "the best crawfish right now" or "what's happening this weekend."

**Solution:** A beautiful, searchable, AI-powered hub where:
- Data is auto-populated from Google Places, Yelp, Eventbrite, and local sources
- Chelsea curates golden Facebook insights via weekly dumps (15-20 min/week)
- AI organizes, ranks, and surfaces the best of Acadiana
- Community can contribute ratings, photos, comments, and recommendations

---

## 2. Brand & Identity

| Field | Value |
|-------|-------|
| **Name** | GeauxFind |
| **Domain** | geauxfind.com (AVAILABLE ✅) |
| **Tagline** | "Find the best of Acadiana" |
| **Email** | hello@geauxfind.com (→ geauxluna@gmail.com via Cloudflare routing) |
| **Instagram** | @geauxfind (AVAILABLE ✅) |
| **TikTok** | @geauxfind (AVAILABLE ✅) |
| **Twitter/X** | @geauxfind (AVAILABLE ✅) |
| **Entity** | CH Tech Ventures LLC |
| **Colors** | TBD — suggest Cajun-inspired: deep red, gold, cream, bayou green |
| **Vibe** | Warm, local, authentic, modern but not sterile |

---

## 3. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 15 (App Router) | SEO-critical for local search, SSR/ISR, Chelsea knows it |
| **Database** | Supabase (PostgreSQL) | Free tier generous, auth built-in, real-time subscriptions |
| **Auth** | Supabase Auth (Google + email) | Zero-cost, handles social login |
| **Hosting** | Vercel | Free tier, auto-deploys from GitHub |
| **Storage** | Supabase Storage | Photos, user uploads (1GB free) |
| **Maps** | Google Maps Embed API | Free unlimited for basic embeds |
| **Search** | Supabase full-text search + pgvector | Free, built into Postgres |
| **AI** | Venice API (DeepSeek V3.2 / Qwen3 small) | Cheapest inference: $0.33/1M input tokens |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid development, consistent design |
| **Data Pipeline** | Luna cron jobs (OpenClaw) | Automated scraping + AI parsing |
| **Email** | Resend (transactional) | 3K emails/mo free tier |
| **DNS/CDN** | Cloudflare | Free, manages domain + email routing |
| **Repo** | GitHub (nonfungibletimes/geauxfind) | Luna sandbox account |

---

## 4. Information Architecture

### 4.1 Main Categories

```
GeauxFind
├── 🍽️ Food & Drink
│   ├── Restaurants (by cuisine, area, price)
│   ├── Best Of lists (crawfish, boudin, gumbo, etc.)
│   ├── "Where to Find ___" (searchable Q&A)
│   ├── Price Alerts (crawfish deals, specials)
│   └── New Openings
│
├── 🎪 Events & Festivals
│   ├── This Weekend (auto-generated Thursday)
│   ├── Festival Calendar (annual + recurring)
│   ├── Cook-offs & Competitions
│   ├── Live Music Tonight
│   └── Community Events
│
├── 🎵 Music & Nightlife
│   ├── Venues
│   ├── Tonight's Lineup
│   ├── Artist/Band Profiles
│   └── Zydeco, Cajun, Swamp Pop schedules
│
├── 🧑‍🍳 Recipes ("What to Put")
│   ├── Community Recipes
│   ├── Classic Cajun (étouffée, gumbo, jambalaya)
│   ├── Seasonal (crawfish, King Cake)
│   ├── Restaurant-Inspired ("Cook This at Home")
│   └── Submit a Recipe
│
├── 📍 Local Finds
│   ├── Best of Acadiana (community-ranked)
│   ├── Hidden Gems
│   ├── New in Town (tourist mode)
│   └── Grocery & Markets
│
└── 💬 Community
    ├── Ask Acadiana (Q&A)
    ├── Photo Feed
    ├── Leaderboard (top contributors)
    └── Submit a Tip
```

### 4.2 Pages

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Hero + search bar + "This Weekend" + trending + categories |
| **Search Results** | `/search?q=` | AI-powered natural language search results |
| **Category** | `/food`, `/events`, `/music`, `/recipes`, `/finds` | Filtered listings |
| **Place Detail** | `/place/[slug]` | Restaurant/venue profile: info, ratings, reviews, photos, map |
| **Event Detail** | `/event/[slug]` | Event info, date/time, location, map, related events |
| **Recipe Detail** | `/recipe/[slug]` | Formatted recipe with ingredients, steps, photos |
| **Best Of** | `/best/[category]` | "Best Crawfish in Acadiana" — ranked list |
| **This Weekend** | `/this-weekend` | Auto-generated weekend roundup |
| **Ask Acadiana** | `/ask` | AI-powered Q&A: "Where's the best chicken salad?" |
| **Submit** | `/submit` | Community submission form (tip, recipe, photo, event) |
| **Profile** | `/profile/[id]` | User profile with submissions and favorites |
| **About** | `/about` | About GeauxFind, community guidelines |

---

## 5. Data Models (Supabase/PostgreSQL)

### 5.1 Core Tables

```sql
-- Places (restaurants, venues, markets, etc.)
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'restaurant', 'venue', 'market', 'bar', etc.
  cuisine TEXT[], -- ['cajun', 'seafood', 'bbq']
  description TEXT,
  address TEXT,
  city TEXT NOT NULL, -- 'Lafayette', 'Broussard', 'Scott', etc.
  zip TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  website TEXT,
  hours JSONB, -- { "mon": "11:00-21:00", ... }
  price_range INT, -- 1-4 ($-$$$$)
  
  -- Aggregated scores
  google_rating NUMERIC(2,1),
  google_review_count INT,
  yelp_rating NUMERIC(2,1),
  yelp_review_count INT,
  community_rating NUMERIC(3,2), -- GeauxFind community average
  community_review_count INT DEFAULT 0,
  
  -- External IDs
  google_place_id TEXT,
  yelp_id TEXT,
  
  -- Media
  cover_photo TEXT, -- URL
  photos TEXT[], -- Array of URLs
  
  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  tags TEXT[], -- ['crawfish', 'live-music', 'family-friendly']
  source TEXT, -- 'google', 'yelp', 'community', 'chelsea_dump'
  ai_summary TEXT, -- AI-generated "People love the..." summary
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Events (festivals, cook-offs, live music, community)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'festival', 'cookoff', 'music', 'market', 'community'
  description TEXT,
  
  -- When
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- iCal RRULE
  
  -- Where
  venue TEXT,
  address TEXT,
  city TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  place_id UUID REFERENCES places(id),
  
  -- Details
  price TEXT, -- 'Free', '$10', '$5-20'
  ticket_url TEXT,
  website TEXT,
  lineup TEXT[], -- For music events
  food_vendors TEXT[], -- For festivals
  
  -- Media
  cover_photo TEXT,
  photos TEXT[],
  
  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[],
  source TEXT, -- 'eventbrite', 'scrape', 'community', 'chelsea_dump'
  source_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Recipes ("What to Put")
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT, -- 'cajun', 'creole', 'dessert', 'seafood', 'sides'
  
  -- Recipe content
  ingredients JSONB NOT NULL, -- [{ "item": "crawfish tails", "amount": "1 lb" }]
  instructions JSONB NOT NULL, -- [{ "step": 1, "text": "Make a roux..." }]
  prep_time INT, -- minutes
  cook_time INT, -- minutes
  servings INT,
  difficulty TEXT, -- 'easy', 'medium', 'hard'
  
  -- Media
  cover_photo TEXT,
  photos TEXT[],
  video_url TEXT,
  
  -- Community
  author_id UUID REFERENCES profiles(id),
  community_rating NUMERIC(3,2),
  rating_count INT DEFAULT 0,
  
  -- AI
  ai_tips TEXT, -- AI-generated cooking tips
  inspired_by UUID REFERENCES places(id), -- "Inspired by Don's Seafood"
  
  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[], -- ['crawfish', 'one-pot', 'grandma-recipe']
  source TEXT, -- 'community', 'chelsea_dump', 'ai_generated'
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews/Tips (community contributions)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id),
  author_id UUID REFERENCES profiles(id) NOT NULL,
  
  rating INT CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  photos TEXT[],
  
  -- What they recommend
  recommended_dishes TEXT[], -- ['crawfish étouffée', 'bread pudding']
  
  -- Metadata
  upvotes INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Best Of Lists (AI-curated + community-voted)
CREATE TABLE best_of_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, -- "Best Crawfish in Acadiana"
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'food', 'music', 'events'
  description TEXT,
  
  -- Entries (ordered)
  entries JSONB NOT NULL, -- [{ "place_id": "...", "rank": 1, "reason": "..." }]
  
  -- Metadata
  methodology TEXT, -- 'community_votes', 'ai_curated', 'best_of_acadiana_2025'
  last_updated TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  
  -- Stats
  review_count INT DEFAULT 0,
  recipe_count INT DEFAULT 0,
  tip_count INT DEFAULT 0,
  reputation_score INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ask Acadiana (Q&A)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id),
  question TEXT NOT NULL,
  
  -- AI answer
  ai_answer TEXT,
  ai_sources JSONB, -- [{ "place_id": "...", "reason": "..." }]
  
  -- Community answers
  answer_count INT DEFAULT 0,
  upvotes INT DEFAULT 0,
  
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Community Answers
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  text TEXT NOT NULL,
  place_id UUID REFERENCES places(id), -- Optional place reference
  upvotes INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chelsea's Dumps (raw intake)
CREATE TABLE intake_dumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_text TEXT NOT NULL,
  source TEXT, -- 'discord', 'telegram', 'manual'
  
  -- AI processing
  processed BOOLEAN DEFAULT false,
  parsed_items JSONB, -- AI-extracted structured data
  items_created INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_places_city ON places(city);
CREATE INDEX idx_places_type ON places(type);
CREATE INDEX idx_places_tags ON places USING GIN(tags);
CREATE INDEX idx_places_cuisine ON places USING GIN(cuisine);
CREATE INDEX idx_events_start ON events(start_date);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);

-- Full-text search
ALTER TABLE places ADD COLUMN fts tsvector 
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(tags, ' '), ''))
  ) STORED;
CREATE INDEX idx_places_fts ON places USING GIN(fts);

ALTER TABLE events ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(tags, ' '), ''))
  ) STORED;
CREATE INDEX idx_events_fts ON events USING GIN(fts);

ALTER TABLE recipes ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(tags, ' '), ''))
  ) STORED;
CREATE INDEX idx_recipes_fts ON recipes USING GIN(fts);
```

### 5.2 Row Level Security (RLS)

```sql
-- Public read access to all content
-- Write access only for authenticated users (reviews, recipes, questions)
-- Admin access for Chelsea + Luna service role

ALTER TABLE places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON places FOR SELECT USING (true);
CREATE POLICY "Service write" ON places FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create" ON reviews FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can edit own" ON reviews FOR UPDATE USING (auth.uid() = author_id);

-- Similar patterns for recipes, questions, answers
```

---

## 6. Data Pipeline Architecture

### 6.1 Automated Sources (Luna Cron Jobs)

| Source | Frequency | Data | Method |
|--------|-----------|------|--------|
| Google Places API | Weekly | Restaurant details, ratings, photos | API calls (Nearby Search + Place Details) |
| Yelp Fusion API | Weekly | Ratings, reviews, categories | API calls |
| Eventbrite | Daily | Events in Acadiana area | API calls |
| acadiana.org | Weekly | Community events calendar | Web scrape |
| KLFY Acadiana Eats | Weekly | Featured restaurant segments | Web scrape |
| Lafayette Travel | Monthly | Tourism info, featured restaurants | Web scrape |
| Best of Acadiana | Annually | Category winners | Web scrape (yourchoiceawards.com) |
| Venue websites | Weekly | Live music schedules | Web scrape (targeted venues) |
| Facebook email digests | Daily | Group highlights | Email parsing (geauxluna@gmail.com) |

### 6.2 Chelsea's Weekly Dump Flow

```
Chelsea pastes in #geauxfind-inbox (Discord)
        │
        ▼
Luna detects new messages in channel
        │
        ▼
Raw text saved to intake_dumps table
        │
        ▼
AI Parser (Venice DeepSeek V3.2):
  - Extract entities: places, dishes, events, recipes, prices
  - Categorize each item
  - Score confidence level
        │
        ▼
Cross-reference existing database:
  - Match to existing places (fuzzy name match)
  - Match to Google Places API for new places
  - Deduplicate
        │
        ▼
Create/update records:
  - New place? → Create place record, populate from Google
  - Existing place? → Add tip/review, update tags
  - Event? → Create event record
  - Recipe? → Create recipe record
  - Price alert? → Create notification
        │
        ▼
Publish to site (auto) + flag uncertain items for Chelsea review
```

### 6.3 AI Processing Pipeline

```
New data arrives (any source)
        │
        ▼
CLASSIFY: What type of content? (place/event/recipe/tip)
Model: Venice Qwen3-small (free via DIEM)
        │
        ▼
EXTRACT: Pull structured data from unstructured text
Model: Venice DeepSeek V3.2 ($0.33/1M tokens)
        │
        ▼
ENRICH: Add AI-generated summaries, tags, and connections
Model: Venice Qwen3-small
        │
        ▼
RANK: Update "Best Of" rankings using:
  - Community ratings (weighted by recency)
  - Google/Yelp ratings
  - Mention frequency in dumps
  - Sentiment analysis of reviews
Model: Venice balanced (weekly batch job)
        │
        ▼
GENERATE: Weekly auto-content
  - "This Weekend in Acadiana" roundup (Thursdays)
  - "New This Week" digest
  - Seasonal features ("Crawfish Season Guide")
Model: Venice balanced
```

---

## 7. AI Features (Detailed)

### 7.1 "Ask Acadiana" — AI-Powered Search

**User experience:**
- Search bar on homepage: "Where's the best boudin in Scott?"
- AI searches the database (places, reviews, tips) using vector similarity + full-text
- Returns a conversational answer with specific recommendations and sources
- Community can add their own answers below

**Tech:**
- Query → Supabase full-text search + pgvector similarity
- Top results fed to Venice DeepSeek V3.2 as context
- AI generates a natural language answer citing specific places
- Answer cached for 24h (same/similar questions get instant response)
- **Cost:** ~$0.001 per query (cached queries: $0)

### 7.2 Auto-Generated "This Weekend" Roundup

**Cron:** Every Thursday at 9 AM CT
**Process:**
1. Query all events with start_date between Friday-Sunday
2. Query any new restaurant tips from the week
3. Check weather forecast (free API)
4. Feed to AI → generate engaging weekend roundup
5. Publish to `/this-weekend` + optional email newsletter

### 7.3 Smart "Best Of" Rankings

**How rankings work:**
- Base score = weighted average: community_rating (40%) + google_rating (25%) + yelp_rating (25%) + mention_frequency (10%)
- Recency bonus: reviews from last 30 days weighted 2x
- AI generates a reason for each top pick: "Known for their perfectly seasoned crawfish boil — consistently the most recommended in Foodies of Acadiana"

**Categories to seed:**
- Best Crawfish
- Best Boudin
- Best Gumbo
- Best Étouffée
- Best Fried Seafood
- Best BBQ/Brisket
- Best Chicken Salad
- Best King Cake (seasonal)
- Best Date Night
- Best Family Restaurant
- Best Food Truck
- Best Brunch
- Best Grocery/Market

### 7.4 Recipe Formatter ("What to Put")

**User submits:** "My mawmaw's gumbo: start with a dark roux, about 1 cup flour and 1 cup oil, cook it till it's the color of chocolate. Add the trinity - onions, celery, bell pepper. Then okra, smoked sausage, chicken..."

**AI returns:** Structured recipe with:
- Title: "Mawmaw's Dark Roux Gumbo"
- Prep time, cook time, servings (estimated)
- Ingredients list (formatted with measurements)
- Numbered steps
- Pro tips
- Suggested sides

### 7.5 "What Should I Eat?" Decision Engine

**Input:** User filters or natural language ("hungry, near Broussard, not seafood, under $15")
**Output:** 3 personalized picks with photos, ratings, and "why you'll like it"
**Tech:** Supabase query with filters → AI picks top 3 with reasoning

### 7.6 Seasonal Intelligence

AI-driven homepage that knows:
- **Jan-Feb:** King Cake rankings, Mardi Gras events
- **Feb-Jun:** Crawfish season — prices, best boils, deals
- **Spring:** Festival season begins — Festivals Acadiens preview
- **Summer:** Snowball stands, outdoor music
- **Fall:** Festival des Acadiens, cook-off season, football food
- **Winter:** Holiday markets, gumbo weather, Christmas events

Homepage hero and featured content rotate automatically.

---

## 8. User Features

### 8.1 Authentication
- **Sign up:** Google OAuth or email/password (Supabase Auth)
- **Browsing without account:** Full read access, no login needed
- **Account required for:** Reviews, ratings, recipe submissions, comments, favorites

### 8.2 User Actions
- ⭐ Rate a place (1-5 stars)
- 📝 Write a review/tip
- 📸 Upload photos
- 🧑‍🍳 Submit a recipe
- ❓ Ask a question in "Ask Acadiana"
- 💬 Answer community questions
- ❤️ Favorite/save places and events
- 🔔 Follow a place for updates
- 👆 Upvote helpful reviews/answers

### 8.3 Gamification
- **Contribution score:** Points for reviews, recipes, photos, answers
- **Leaderboard:** "Top Contributors This Month"
- **Badges:** "Crawfish Connoisseur" (10+ crawfish reviews), "Festival Pro" (attended 5+ events), "Home Chef" (5+ recipes)
- **Keeps community engaged at zero cost**

---

## 9. Monetization (Phase 2 — After Launch)

**Not the priority at launch.** Build audience first, monetize later.

| Revenue Stream | Estimated $/mo | When |
|----------------|---------------|------|
| **Featured Listings** — Restaurants pay to be highlighted | $100-300/listing | 500+ monthly users |
| **Event Promotion** — Featured placement for events | $25-50/event | 500+ monthly users |
| **Newsletter Sponsorships** — "This Weekend" email sponsors | $50-200/issue | 1,000+ subscribers |
| **Affiliate Links** — DoorDash, UberEats, OpenTable | Small but passive | Day 1 (if desired) |
| **"Best of" Badges** — Winners can display a badge | $50/yr | After first "Best Of" vote |
| **Premium Listings** — Enhanced place profiles for businesses | $20-50/mo | 1,000+ monthly users |

---

## 10. Non-Functional Requirements

### 10.1 Performance
- **Page load:** < 2s (ISR/SSG for listing pages)
- **Search response:** < 1s for database queries, < 3s for AI-powered answers
- **Mobile-first:** 60%+ traffic will be mobile

### 10.2 SEO
- SSR/ISR for all public pages (critical for Google indexing)
- Structured data (Schema.org) for restaurants, events, recipes
- URL structure: `/place/dons-seafood-lafayette`, `/recipe/mawmaws-dark-roux-gumbo`
- Meta descriptions auto-generated per listing
- Target keywords: "best [food] in lafayette", "acadiana events this weekend", "cajun [recipe] recipe"

### 10.3 Mobile
- Responsive (Tailwind breakpoints)
- PWA-capable (installable on phone)
- Bottom navigation bar (mobile)
- Touch-friendly interactions

### 10.4 Moderation
- AI auto-flags spam/inappropriate content
- Community report button
- Chelsea has admin dashboard for content review
- Luna monitors via cron (weekly review of flagged content)

---

## 11. Build Plan

### Phase 1: MVP (Week 1-2) — Get It Live

**Goal:** Searchable directory with 100+ places, events calendar, basic community features.

| Day | Task | Agent |
|-----|------|-------|
| 1 | Set up repo, Next.js scaffold, Supabase project, Tailwind + shadcn | Codex |
| 1 | Register domain, DNS, email routing | Chelsea + Luna |
| 2 | Database schema (all tables above) + seed data pipeline | Codex |
| 2 | Google Places API → seed 200+ Acadiana restaurants | Luna cron |
| 3 | Homepage, search, category pages | Codex |
| 3 | Yelp data merge + event scraping setup | Luna cron |
| 4 | Place detail page, event detail page | Codex |
| 5 | Recipe page, submission forms | Codex |
| 5 | "Ask Acadiana" AI search integration | Codex |
| 6 | Auth, user profiles, reviews/ratings | Codex |
| 7 | Mobile optimization, PWA setup | Codex |
| 7 | First Chelsea dump → AI processing pipeline | Luna |
| 8-9 | QA, bug fixes, polish | Luna + Codex |
| 10 | Deploy to Vercel, go live | Luna |

### Phase 2: Growth (Week 3-4)

- "This Weekend" auto-roundup
- Smart "Best Of" rankings
- Newsletter setup (Resend)
- Social account creation + initial posts
- Gamification (badges, leaderboard)
- SEO optimization

### Phase 3: Scale (Month 2+)

- Community moderation tools
- Recipe formatter AI
- "What Should I Eat?" decision engine
- Featured listing monetization
- Seasonal content automation
- Tourist mode

---

## 12. Monthly Cost Projection

### At Launch (0-500 users)

| Item | Cost/mo |
|------|---------|
| Domain (Cloudflare) | $0.83 |
| Vercel (free) | $0 |
| Supabase (free) | $0 |
| Google Places API | $0 |
| Yelp API (free tier) | $0 |
| Venice AI (shared DIEM) | ~$3-5 |
| Resend (free tier) | $0 |
| **Total** | **~$4-6/mo** |

### Growth Phase (500-5,000 users)

| Item | Cost/mo |
|------|---------|
| Domain | $0.83 |
| Vercel (free still likely) | $0 |
| Supabase (may need Pro) | $0-25 |
| Google Places API | $0-10 |
| Venice AI (more queries) | ~$5-15 |
| Resend | $0-20 |
| **Total** | **~$6-70/mo** |

### Scale Phase (5,000+ users)

| Item | Cost/mo |
|------|---------|
| Domain | $0.83 |
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Google Places API | $10-30 |
| Venice AI | $15-30 |
| Resend | $20 |
| **Total** | **~$90-125/mo** |

At scale, featured listings from 3-5 restaurants ($100-300/mo each) covers all costs and then some.

---

## 13. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low initial adoption | Medium | Seed with rich content before launch; leverage Chelsea's local network |
| Content goes stale | High | Automated pipelines + Chelsea's weekly dumps keep it fresh |
| Facebook groups remain preferred | Medium | Can't replace social, but can complement — "searchable archive" angle |
| Google Places API pricing changes | Low | Cache aggressively, data doesn't change fast for local restaurants |
| Spam/bad actors | Medium | AI moderation + community reporting + admin tools |
| Chelsea's time commitment exceeds 20 min/week | Medium | Luna handles all automation; dumps are optional not mandatory |

---

## 14. Success Metrics

### Month 1
- [ ] 200+ places in database
- [ ] 50+ events listed
- [ ] 20+ recipes
- [ ] Site live and indexed by Google
- [ ] First Chelsea dump processed successfully

### Month 3
- [ ] 100+ monthly active users
- [ ] 50+ community-submitted reviews
- [ ] "Best Of" lists populated with 5+ categories
- [ ] "This Weekend" roundup running automatically

### Month 6
- [ ] 500+ monthly active users
- [ ] First featured listing sold
- [ ] Newsletter with 200+ subscribers
- [ ] 10+ community-submitted recipes

---

## 15. Appendix

### A. Acadiana Cities/Areas to Cover
- Lafayette (Hub City)
- Broussard
- Scott
- Youngsville
- Breaux Bridge
- Rayne
- Crowley
- Opelousas
- New Iberia
- Abbeville
- Henderson
- Eunice
- Carencro
- Duson
- Maurice

### B. Facebook Groups to Monitor (via email digests)
- Foodies of Acadiana
- Lafayette Foodies
- What's Happening in Acadiana
- Acadiana Events
- (Chelsea to provide full list)

### C. Key Venues for Music Scraping
- Blue Moon Saloon (Lafayette)
- Artmosphere (Lafayette)
- The Wurst Biergarten (Lafayette)
- Rock'n'Bowl (Lafayette)
- Pont Breaux's (Breaux Bridge)
- Hideaway on Lee (Lafayette)
- (Chelsea to expand list)

### D. Competing/Complementary Resources
- EatLafayette app (Lafayette Travel) — tourist-focused, no community
- acadiana.org — dated directory
- Best of Acadiana (yourchoiceawards.com) — annual survey only
- KLFY Acadiana Eats — TV segment, no searchable database
- Foodies of Acadiana (Facebook) — unstructured, unsearchable
- Google Maps/Yelp — generic, not Acadiana-specific curation

---

*This document is a living TRD. Updates will be tracked in version history.*
