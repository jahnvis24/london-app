# Curated London — Claude Code Briefing

## What this is
React/Vite London itinerary generator. Users answer 9 questions, get AI-generated day/night plan.

## Stack
- Frontend: React/Vite, deployed on Vercel (auto-deploys on push to main)
- Database: Supabase (PostgreSQL) — main table: `experiences`
- AI: Claude API via `/api/claude.mjs`
- Maps: Google Places API (New format with X-Goog-FieldMask headers)
- Data pipeline: TikTok scraper → Claude parser → Google enrichment → Supabase

## Key rules
- `api/` folder uses `.mjs` ES module syntax always
- `google_price_level` column is TEXT (e.g. `PRICE_LEVEL_MODERATE`)
- Google Places: New API format, NOT the old findplacefromtext endpoint
- Vercel Hobby: max 2 cron jobs
- Always run `vercel --prod` to deploy after pushing to main

## Recently fixed
- Map pin picker was showing on every quiz step (duplicate JSX removed)
- Celebrity badge now shows 💫 on stop cards when `celebrity_tags` exists in DB
- Admin card now displays ⭐ google_rating in meta line
