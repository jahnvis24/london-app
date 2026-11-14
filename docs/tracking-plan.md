# Curated London — Tracking Plan & Metrics

Source of truth for Mixpanel (EU project). Code: `src/analytics.js`, `mp()` calls in `src/App.jsx`.
Tracking is opt-in (consent banner). Users are identified by Supabase user id, never email.

## 1. Events

### Live now (20-event plan from Mixpanel, 2026-11-14)
Events fired before the consent banner is answered are held for the tab and sent only if the user taps Allow.

| Event | Fires when |
|---|---|
| signup_started | Email submitted / Google tapped |
| signup_completed | New account's first sign-in (created <60s ago) |
| invite_link_opened | `?invite=` or `?blist=` link opened |
| taste_game_completed | Onboarding this-or-that finishes |
| onboarding_step_viewed | Each onboarding step (location, name, interests, vibe, taste_game) |
| first_place_saved | User's first save (per-browser flag) |
| save_created | Every save (link/TikTok import, manual, Discover, swipe, friend profile/feed) |
| discover_impression | Trending / top picks / because-you-like shown, or swipe deck opened (once per mount) |
| discover_save_conversion | Save from the Discover tab (swipe tap or via details card) |
| discover_venue_opened | Discover card opened |
| plan_generation_requested | Generate pressed |
| plan_generation_succeeded | Plan returned |
| plan_generation_failed | Generation error (extra event, not in Mixpanel's plan) |
| plan_viewed | Result / My Plans / shared plan screen opens |
| plan_regeneration_requested | Same quiz answers generated again |
| plan_edited_saved_or_shared | action = edited (swap/remove), saved (friend's plan), shared |
| plan_shared | Copy link / WhatsApp |
| plan_share_link_opened | `?plan=` link loads a plan |
| share_link_converted | Opener later signs up / saves first place (same browser) |
| friend_connected | Friend code entered or invite link accepted |
| bucket_list_joined | `?blist=` link, or added to a list by a friend |

Properties not available in this web app, so omitted or approximated: `device_os` is iOS / Android / desktop_web; `algorithm_variant` is a constant (`taste_v1`); `time_window` is weekday/weekend of the day generated; `regeneration_reason` is always `other`; `days_since_invite` is not sent (invite links carry no timestamp); `plan_share_origin` / `share_recipient_type` are fixed; `share_channel` is web_link or other; `user_type` is always `new_signup`.

### User properties to set (`mixpanel.people.set`)
signup_date, signup_method, first_device_type, taste_axes (budget/scene), saved_places_count, plans_generated_count, friends_count, has_shared_plan (bool), is_admin/tester (so you can exclude yourselves).

### Conventions
- snake_case event and property names, past-tense verbs.
- One event per user action; put variations in properties, not new events.
- Exclude your own accounts via an `is_internal` user property, then filter it out in every report.

## 2. Metrics

**North star:** Plans generated that are shared or kept (saved/scheduled) per weekly active user.

**Activation (first 7 days)** — define "activated" as: taste game done AND ≥5 places saved AND ≥1 plan generated.
- % of signups activated within 7 days
- Time from signup_completed to first_place_saved / to first plan

**Funnels (build these in Mixpanel first)**
1. Acquisition: invite_link_opened → signup_started → signup_completed → taste_game_completed → first_place_saved
2. Planning: places_saved (≥3) → plan_generation_requested → plan_generation_succeeded → plan_edited_saved_or_shared
3. Virality: plan_generation_succeeded → share_link_copied/sent → invite_link_opened → signup_completed

**Quality / trust**
- Generation success rate = succeeded ÷ requested
- Regeneration rate = regenerated ÷ succeeded (high = plans aren't good enough)
- p50/p95 generation_duration_ms
- Failure reasons breakdown
- Edit rate per plan (swap/remove) — high edits signal poor routing/venue fit
- used_saved_places_ratio — are plans using the user's own saves?

**Engagement & retention**
- WAU / MAU, WAU ÷ MAU stickiness
- D1 / D7 / D30 retention (return event: any of places_saved, plan_generation_requested)
- Places saved per active user per week
- Plans generated per active user per week

**Growth / virality**
- Share rate = users who share ÷ users who generate
- Invite conversion = signup_completed ÷ invite_link_opened
- K-factor ≈ shares per sharer × invite conversion
- Friend connections per active user

**Content**
- Discover → save conversion by surface and by Top Pick vs not
- Top categories saved, save_source mix (TikTok vs manual), ai_parse_success rate

## 3. Suggested first dashboard
1. Signups (daily) + activation rate (7-day)
2. Acquisition funnel
3. Planning funnel + generation success/regeneration rate
4. WAU and D7 retention
5. Shares and invite conversion

## 4. Known limits of current instrumentation
- signup_completed is inferred from account age (<60s).
- first_place_saved and places_saved_count use per-browser counters; a new device restarts them.
- share_link_converted only works in the same browser as the link open.
- Saves from onboarding likes are not tracked; reorder / time-slot / add-place edits are not tracked.
- Pre-consent events live in sessionStorage, so they are lost if the tab closes before the user answers.
