# Curated London — Tracking Plan & Metrics

Source of truth for Mixpanel (EU project). Code: `src/analytics.js`, `mp()` calls in `src/App.jsx`.
Tracking is opt-in (consent banner). Users are identified by Supabase user id, never email.

## 1. Events

### Live now
| Event | Fires when | Key properties |
|---|---|---|
| invite_link_opened | A shared `?plan=` link loads a plan | source, recipient_cohort, plan_id, utm_* |
| signup_started | User submits email or taps Google | acquisition_channel, signup_method, utm_* |
| signup_completed | New account's first sign-in (created <60s ago) | signup_method, first_device_type, onboarding_started, timestamp_utc |
| taste_game_completed | Onboarding this-or-that finishes | axes_completed_count, preferred_budget, preferred_scene, variant |
| first_place_saved | User's first save (flag in localStorage) | save_source, place_category, ai_parse_success, places_enriched_provider |
| places_saved | Every later save | save_source, place_category, saved_count_in_session, days_since_signup |
| plan_generation_requested | Generate pressed | plan_mode, travel_time_aware, input_places_count, generation_variant |
| plan_generation_succeeded | Plan returned | plan_id, items_in_plan_count, generation_duration_ms, used_saved_places_ratio |
| plan_generation_failed_or_regenerated | Error, or same answers re-run | result_type, failure_reason, regen_attempt_number, plan_mode |
| plan_edited_saved_or_shared | Swap/remove stop, copy link, WhatsApp | action_type, edit_type |

### Recommended next (gaps)
| Event | Why | Properties |
|---|---|---|
| onboarding_step_viewed | Find where onboarding drops | step, step_name |
| plan_saved | Plans auto-save today, so "saved" is not a user action; track explicit keeps/schedules | plan_id, scheduled |
| plan_viewed | Revisits of My Plans = retention signal | plan_id, plan_age_days |
| discover_venue_opened | Discover → save conversion denominator | surface (trending, because_you_like, swipe, top_pick), venue_id, is_top_pick |
| place_saved_from_discover | Numerator for the above (add `surface` to places_saved) | surface |
| friend_connected | Already in the Supabase table; mirror to Mixpanel | via (invite_link, friend_code) |
| bucket_list_created / bucket_list_joined | Social loop | list_id, member_count |
| friend_feed_viewed / friend_save_copied | Feed value | friend_count |
| share_link_converted | Logged-out recipient signs up after opening a plan | plan_id |
| app_error | Failures that aren't plan generation (parse, enrich) | area, reason |

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
- recipient_cohort is always `new_or_unauthed`; experiment_variant, recipient_logged_out_share_opened, saved_from_discover are not sent.
- signup_completed is inferred from account age (<60s).
- first_place_saved uses a per-browser flag; a returning user on a new device could fire it again.
- Saves from the People feed, friend profiles and onboarding likes are not tracked.
- Reorder / time-slot / add-place edits are not tracked.
