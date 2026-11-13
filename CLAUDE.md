# Curated London — Claude Code Briefing

## What this is
Mobile-first React/Vite app for saving London spots and turning them into AI-generated day/night plans, with shared bucket lists and friends.

## Working across two laptops — READ FIRST
The owner works on this repo from two laptops with different Claude Code accounts. Claude's local memory does NOT sync between them — this file and `TODO.md` are the shared source of truth.

- **One branch: `main`.** Don't create long-lived branches. Short-lived ones are fine if merged back the same session.
- **Start of every session:** `git pull` before touching anything. If the pull fails (diverged/conflicts), stop and explain to the user — never `reset --hard` or force-push without asking.
- **End of every task:** commit and `git push` so the other laptop can pull it.
- **Deploys come from GitHub, not laptops.** Vercel builds `main` automatically on push. Do NOT run `vercel --prod` — it uploads the local folder, and a stale laptop will put old code live (this happened 2026-11-13 and reverted the redesign).
- When the user says "add to the to-do list", update `TODO.md` and commit it.

## Stack
- Frontend: React 19 + Vite, Leaflet maps, single large `src/App.jsx`
- Backend: Vercel serverless functions in `api/*.mjs`
- Database: Supabase (PostgreSQL) with RLS — main table: `experiences`
- AI: Claude API via `/api/claude.mjs` (model pinned to `claude-sonnet-4-6`, max_tokens capped at 4096)
- Places: Google Places API (New format with X-Goog-FieldMask headers)
- Data pipeline: TikTok scraper → Claude parser → Google enrichment → Supabase

## Key rules
- `api/` folder uses `.mjs` ES module syntax always
- Every API route must call `requireUser` (or `requireCron` for cron jobs) and `applyCors` from `api/_auth.mjs`. Admin checks use `profiles.is_admin`. Never trust a `user_id` from the request body — use the verified user's id.
- Never hardcode keys. Scripts read `VITE_SUPABASE_URL` / `SUPABASE_SERVICE_KEY` from env. This repo is **public**.
- Server-side fetches of user-supplied URLs go through `safePublicUrl` (see `api/saved-tools.mjs`).
- `google_price_level` column is TEXT (e.g. `PRICE_LEVEL_MODERATE`)
- Google Places: New API format, NOT the old findplacefromtext endpoint
- Vercel Hobby: max 2 cron jobs, 12 functions
