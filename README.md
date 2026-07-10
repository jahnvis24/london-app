# Curated — your city, saved and planned

Curated is a mobile-first web app for saving places you want to go and turning them into real plans. Capture a spot from a TikTok, an Instagram reel, a screenshot, a Google Maps link, or just type it in — Curated enriches it with Google data, drops it on a map, and can spin your saves into a full day-or-night itinerary. Build shared bucket lists with friends, tick them off together, and see what everyone's saving.

> Originally built around London — the app itself is city-agnostic.

---

## ✨ Features

- **Capture from anywhere** — save a spot from a TikTok/Instagram link, a screenshot, a Google Maps URL, or a manual entry. Claude parses the content and Google Places fills in the address, rating, price, photos and coordinates.
- **AI itineraries** — answer a few quick questions and get a routed day or night plan built from your saves (or from scratch).
- **Interactive map** — every saved spot on a Leaflet map, grouped into lists, filterable by category.
- **Shared bucket lists** — build lists with friends, tick items off together in real time, plan dates, and push items to Google Calendar.
- **Friends** — connect with a 4-letter word code, browse a friend's saves in an Instagram-style profile, and copy any spot to your own board.
- **This-or-that** — a quick swipe game that learns your taste to sharpen recommendations.
- **Delight** — confetti, haptics and sound on the moments that matter (saving, ticking off a list, connecting a friend).

## 🧱 Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite, Leaflet maps |
| Backend | Vercel serverless functions (`api/*.mjs`, ES modules) |
| Database | Supabase (PostgreSQL) with Row-Level Security + Realtime |
| AI | Claude (Anthropic API) via `api/claude.mjs` |
| Places data | Google Places API (New) — enrichment, photos, travel time |
| Ingestion | TikTok via TIKWM; Vercel Blob for image storage |
| Hosting | Vercel |

## 🔀 How a save flows

```
TikTok / Instagram / screenshot / Maps link / manual
        │
        ▼
  Claude parses it  →  Google Places enriches it  →  Supabase (experiences)
        │                                                    │
        └──────────────► map · lists · AI itineraries ◄──────┘
```

## 🚀 Getting started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- API keys: [Anthropic](https://console.anthropic.com), [Google Places](https://developers.google.com/maps/documentation/places/web-service), and a TIKWM token (for TikTok ingestion)

### Install
```bash
git clone <your-repo-url>
cd curated
npm install
```

### Environment variables
Create a `.env` file in the project root:

```bash
# Frontend (exposed to the browser — must be VITE_ prefixed)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_MAPBOX_TOKEN=optional-mapbox-token   # falls back to free CARTO tiles if unset

# Backend (serverless functions — keep secret, never VITE_ prefixed)
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_PLACES_KEY=your-google-places-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
TIKWM_API_TOKEN=your-tikwm-token
```

### Database
Run the SQL files in [`migrations/`](migrations/) in your Supabase SQL editor, in date order. They create the `experiences`, `profiles`, `connections`, `shared_lists`, `venue_ratings` (and related) tables plus their RLS policies.

### Run locally
```bash
npm run dev        # Vite dev server
```
The `api/` functions run on Vercel. To exercise them locally, use the [Vercel CLI](https://vercel.com/docs/cli):
```bash
vercel dev
```

## 📜 Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run proxy` | Local Express proxy (`server.js`) for the Claude API |

## 🗂️ Project structure

```
london-app/
├── src/
│   └── App.jsx          # The app (React, single-file, inline styles)
├── api/                 # Vercel serverless functions (.mjs ES modules)
│   ├── claude.mjs         # Claude API proxy
│   ├── enrich-venue.mjs   # Google Places enrichment + London zone classifier
│   ├── saved-tools.mjs    # Photos / images / Maps-link parsing
│   ├── tiktok*.mjs        # TikTok fetch + parse
│   ├── travel-time.mjs    # Google routing between stops
│   └── ...
├── migrations/          # Supabase schema + RLS (run in date order)
├── scripts/             # One-off data backfills / bulk imports
└── public/              # PWA manifest, icons
```

## ☁️ Deployment

Hosted on **Vercel**. Set the environment variables above in the Vercel project settings, then:

```bash
vercel --prod
```

> Note: pushing to `main` does **not** auto-deploy in this setup — deploys are triggered explicitly with the Vercel CLI. On the Hobby plan, a maximum of 2 cron jobs is allowed.

## 📝 Notes & conventions

- `api/` files always use `.mjs` ES module syntax.
- Google Places uses the **New** API format (`X-Goog-FieldMask` headers), not the legacy `findplacefromtext` endpoint.
- `google_price_level` is stored as TEXT (e.g. `PRICE_LEVEL_MODERATE`).
- Secrets live only in serverless functions — never prefix a secret with `VITE_`, or it ships to the browser.

## 📄 License

**All rights reserved.** © 2026 Jahnvi Solanki.

This source code is published for reference and portfolio purposes only. No permission is granted to use, copy, modify, distribute, or create derivative works, in whole or in part, without the author's express written consent.

---

_Not affiliated with any venue, platform, or data provider referenced above._
