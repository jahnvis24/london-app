# Shared itineraries: featured picks and plans on your profile

Status: proposed, not built. Owner decisions marked **Decide**.

## What
Two ways to see an itinerary someone else made, and copy it into your own plans.

1. **Featured itineraries on Discover.** A row such as "Itineraries to steal" showing plans
   by influencers, editors or standout users, each with the author's name and photo.
   Tapping one opens the plan read-only with **Copy to my plans** and **Do this** (schedule it).
2. **Plans on your profile.** When you finish a plan you can choose **Show on my profile**.
   Friends see it on your profile (FriendProfile) and in their People feed, and can copy it.

## Why
Seeing a real night out someone did is more persuasive than an AI suggestion, and it gives
people a reason to visit friends' profiles. It also gives influencers a reason to post on
Curated instead of only on TikTok.

## Build on what exists
`shared_plans` already stores a plan snapshot (plan, times, title, owner) and is readable
by anyone with the id. Extend it rather than adding a table:

- `visibility text not null default 'link'` — one of `link` (today's behaviour),
  `friends`, `featured`.
- `author_label text` — display name for featured plans, e.g. "Picked by @name".
- `featured_at timestamptz` — set by an admin; only admins can set `visibility = 'featured'`
  (RLS check on `profiles.is_admin`).
- Friends read their friends' `friends` plans via a policy joining `connections`.
  Listing must not expose `link` plans, which today are readable only by knowing the id.

Copying creates a new row in `plans` for the viewer from the snapshot, with
`ans.copied_from = shared_plans.id`, and fires a Mixpanel `plan_copied` event.

## Decide
- **Who can be featured?** Recommended: admin-only to start (you pick influencers and add
  their plans yourself), rather than an open "apply" flow.
- **Default for "Show on my profile".** Recommended: off, asked once per plan. Plans can
  reveal where someone lives or goes, so sharing should be a choice.
- **Influencer plans without an account.** Recommended: allow admin to create a featured plan
  on behalf of an influencer with an `author_label`, so you can seed the row before launch.
- **Do featured plans follow the Discover area chip?** Recommended: yes, using the zone of
  the first stop.

## Out of scope for v1
Comments or likes on plans, public (non-friend) profiles, payments to influencers.
