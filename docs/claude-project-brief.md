# Curated London — Project Brief

Reference for working on Curated London. Upload this file to the Claude project alongside `README.md` and `CLAUDE.md`. Last updated 14 November 2026.

---

## 1. What the app is

Curated London is a mobile-first web app (PWA) for saving places you want to go in London and turning them into walking itineraries.

**Core loop:** Save → Plan → Share/Do.

- **Save:** capture a spot from a TikTok or Instagram link, a screenshot, a Google Maps link, or by typing it in. Claude parses it, and Google Places fills in the address, rating, price, photo and coordinates.
- **Plan:** answer a short quiz (9 questions) and get an AI-generated day or night plan. A key use case is picking an area and finding things within a **5, 10 or 15-minute walk** to build a walking itinerary.
- **Share/Do:** shared bucket lists with friends, real-time tick-offs, friend profiles, a feed of friends' saves, and calendar scheduling.

**Navigation:** 5 tabs (Discover · Saves · Plans · People · Me) plus a floating capture button. The full spec is in `docs/ia-redesign.md`.

---

## 2. Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite, Leaflet maps. Almost everything is in one file, `src/App.jsx` (about 7,500 lines, inline styles). |
| Backend | Vercel serverless functions in `api/*.mjs` (always ES modules, `.mjs`) |
| Database | Supabase (PostgreSQL) with Row-Level Security and Realtime |
| AI | Claude via `api/claude.mjs`, pinned to `claude-sonnet-4-6`, with a cap of 200 requests per user per day |
| Places data | Google Places API **(New)**: `places.googleapis.com/v1`, with `X-Goog-FieldMask` headers |
| Images | Vercel Blob (`venues/<id>.jpg`) |
| Ingestion | TikTok via TIKWM, run by two Vercel cron jobs |
| Hosting | Vercel (Hobby plan, maximum 2 cron jobs). Node 24 locally. |

---

## 3. Data model

### `experiences`: venues and users' saves (main table)
One table holds two kinds of row:
- **The curated catalogue:** `user_id IS NULL`. **985 approved venues.**
- **Users' personal saves:** `user_id` is set, with personal fields `folder`, `note` and `visit_date` (163 rows).

Key columns: `name, address, area, zone, postcode, category, price, lat, lng, google_place_id, google_rating, google_review_count, google_price_level (TEXT, e.g. PRICE_LEVEL_MODERATE), opening_hours, website, phone, photo_url, comment, vibe_tags[], celebrity_tags[], is_event, event_start, event_end, tiktok_url, source, status`.

- **`status`:** only `approved` or `pending` are allowed, enforced by a check constraint. `pending` is the admin review queue.
- **`category`:** restaurant 207 · bar 242 · cafe 121 · outdoor 108 · experience 98 · nightlife 63 · gallery 50 · museum 41 · market 40 · walk 14 · cultural 1. There is no category for libraries, theatres, cinemas, bookshops or spas.
- **`zone`:** Central, East, North, Northwest, Northeast, West, Southwest, South, Southeast. Assigned by the classifier in `api/enrich-venue.mjs` (neighbourhood name in the address first, then the postcode).
- **`price` bands:** `Free`, `Under £15pp`, `£15-35pp`, `£35-70pp`, `£70pp+`. Every approved venue has one.
- **`vibe_tags`** (fixed vocabulary): social, aesthetic, chill, foodie, hidden_gems, outdoor, cultural, romantic, iconic, fancy, chaotic, solo, underground, scenic, active, affordable.
- **Unique indexes:** one catalogue row per `google_place_id` (`experiences_catalogue_place_unique`), and one save per user per place.

### Other tables
`profiles` (with `is_admin`), `connections` (friends), `shared_lists` and their items, `shared_plans` (public share links, with an `owner`), `plans` (users' saved itineraries), `analytics_events`, `api_usage` (daily Claude cap), `venue_ratings`.

### Views
- **`experiences_public`:** the approved catalogue without personal columns. The app reads venues **only** from this view.
- **`profiles_public`:** id, name, avatar and friend code. No email.

### Security model (RLS)
- Logged-out visitors can read only the two public views. They can't read or write the `experiences` table.
- Signed-in users read and write their own rows, and read connected friends' saves.
- Admins (`profiles.is_admin`) manage the catalogue and the pending queue.
- API routes and scripts use the service key, which bypasses RLS. Every `/api/*` route requires a Supabase login token (`api/_auth.mjs`). Cron routes check `CRON_SECRET`.

Migrations are in `migrations/`. Run them in date order in the Supabase SQL editor. All of them have been applied.

---

## 4. API routes (`api/`)

| Route | Purpose |
|---|---|
| `claude.mjs` | Claude proxy: pinned model, token cap, per-user daily cap |
| `enrich-venue.mjs` | Google Places lookup and zone/area classifier |
| `venue-photo.mjs` | Copies a Google photo to Blob (admin only) |
| `saved-tools.mjs` | Parses photos, screenshots and Maps links |
| `tiktok.mjs`, `tiktok-fetch.mjs`, `process-videos.mjs` | TikTok ingestion (cron at 06:00 and 07:00 UTC) |
| `travel-time.mjs` | Walking and transit time between stops |
| `bulk-import.mjs`, `data-gaps.mjs` | Admin bulk tools |
| `gdpr.mjs` | Data export and deletion |
| `track-login.mjs` | Login tracking |
| `_auth.mjs` | `requireUser`, `requireCron`, CORS helpers |

## 5. Data scripts (`scripts/`)

Run with `node --env-file=.env.local scripts/<name>.mjs`.

- `backfill-photos.mjs`: adds photos to approved venues that have none (Places API (New) → Blob).
- `backfill-details.mjs`: fills empty rating, price and location fields. Dry run by default; add `--apply` to write and `--search` to match by name (check the dry run first, because name search mismatches walking routes).
- `import-*.mjs`, `insert-*.mjs`: one-off bulk imports from earlier coverage work.

---

## 6. Environment variables (names only)

| Where | Variables |
|---|---|
| Frontend (`VITE_`, shipped to the browser) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (a `sb_publishable_` key) |
| Server only | `ANTHROPIC_API_KEY`, `GOOGLE_PLACES_KEY`, `SUPABASE_SERVICE_KEY` (a `sb_secret_` key), `CRON_SECRET`, `TIKWM_API_TOKEN`, `BLOB_READ_WRITE_TOKEN` |
| Unused | `VITE_MAPBOX_TOKEN`, `RAPIDAPI_KEY` |

- **Local setup:** run `vercel env pull .env.local`. Sensitive values come down as `[SENSITIVE]` and must be pasted in by hand.
- `.env` is a symlink to `.env.local`, so that `vercel dev` passes the values to the API routes.
- Never prefix a secret with `VITE_`.

## 7. Running and deploying

```bash
npm run dev          # frontend only
vercel dev           # frontend + /api routes, http://localhost:3000
npm run build
git push origin main && vercel --prod   # project rule: always run vercel --prod after pushing to main
```

---

## 8. Gotchas learned the hard way

- **Supabase returns at most 1,000 rows per request.** Page through anything that can grow, using `.order("id").range(from, from + 999)`. The venue list silently lost 84 venues until it was paged.
- **Supabase query builders have no `.catch()`.** Calling `.insert(...).catch(...)` throws *before* the request is sent. Use `.then(({ error }) => ...)` or `await` and check `error`. Plans were never being saved because of this.
- **Postgres combines RLS policies with OR.** One permissive policy left behind from the dashboard ("Anon can do everything") cancelled out every other rule. After any security change, check `pg_policies`.
- **Use only Google Places API (New).** Not the legacy `findplacefromtext` or `place/details/json` endpoints.
- **Vercel Blob locally:** pass `token: process.env.BLOB_READ_WRITE_TOKEN` to `put()`. Otherwise the SDK tries Vercel's automatic login (OIDC), which isn't enabled for local development.
- **Matching venues by name** can pick the wrong branch (Lamb & Flag, Côte) or turn a walking route into a single landmark. Always check the match's address against the intended area.

---

## 9. Current state (14 November 2026)

- **985 approved catalogue venues**, all with tags, cost and location. 29 have no photo, and 42 have no rating (mostly areas and streets that Google doesn't rate).
- **Walking coverage:** across the 30 busiest 15-minute squares, every one has restaurants, bars and cafés. The remaining gaps are markets (11 squares), museums (10), nightlife (7), galleries (3), activities (2) and outdoor spots (2). Many of these have nothing suitable on Google inside the square. The interactive map is at https://claude.ai/artifact/YZZXcLTMAS6P5TmHuMPhGS
- **Users:** 11 profiles, 4 friend connections, 4 shared lists, 11 saved plans.

### Recently done
- Security hardening applied: RLS on, legacy open policies removed, public views live, admin flag, daily Claude cap.
- Data clean-up: 72 duplicate venues merged and removed, `£` encoding fixed, `google_price_level` normalised to text, outdated events removed or moved to pending, area names standardised (225 → 182), and wrong Google matches fixed.
- 341 photos added and 214 costs filled in.
- 187 venues added to fill coverage gaps. Each search was limited to the exact 15-minute square.
- Fixes: the venue list now loads past 1,000 rows, and plans now save to Supabase.

---

## 10. Open work

From `TODO.md`:
- QA plan quality (chain mode and cascade are done).
- Invite-only code.
- Discover tab curated picks.
- Event reminder notifications.
- Community plans.
- Larger "Because you like" cards.
- Port the admin login ledger from the `cosmetic` branch. Don't run that branch's SQL as it is, because it wipes profile login data.

Before beta (`docs/todo.md`):
- PNG PWA icons.
- Privacy policy page.
- Onboarding tooltips on People and Saves.
- Graceful fallback when Claude or Google is down.
- iOS Safari and Android testing.
- Remove dead code.

Later:
- Code-split `App.jsx`.
- Capacitor for the App Store and Play Store.
- Dark mode.
- Unfriend/block.
- Accessibility fixes.

Data ideas:
- Add a theatre/cinema category or name-based types.
- Fill the remaining market, museum and nightlife gaps.
- O2 Academy Brixton is filed as an activity and probably belongs in nightlife.

**Note:** `README.md` says pushing to `main` doesn't auto-deploy, but Vercel is now connected to GitHub. CLAUDE.md's rule is still to run `vercel --prod` after every push.
