# Curated London — Information Architecture Redesign

**Status:** Design spec · agreed, not yet built
**Last updated:** 2026-06-23

A plan for where every feature lives so the app is easy to navigate, makes sense,
and doesn't feel overloaded. No code has changed yet — this is the blueprint to
build from.

---

## 1. Principles

- **Match the user's loop, not the data model.** The loop is **Save → Plan → Share/Do.**
  Nav reads left-to-right along it.
- **Tabs are destinations; creation is an action.** Anything you *make* (a plan, a
  saved spot) is a button, not a tab.
- **One job per tab.** A segmented control inside a tab is fine; a tab spanning
  unrelated jobs is not.
- **One way to do each thing.** Exactly one capture path, one plan-creation entry
  (repeated *in context* is OK; duplicated *screens* are not).

---

## 2. Navigation — 5 tabs + a capture FAB

```
┌─────────────────────────────────────────────┐
│  Discover     Saves     Plans   People   Me  │
│     🔍         📌        📋       👥      🙂  │
└─────────────────────────────────────────────┘
                 ( + )  ← floating capture button (FAB)
```

Changes from today (6 tabs: Plan · Plans · Saves · Map · People · For me):

- **Plan** tab removed — folded into Discover as a CTA.
- **Map** → renamed **Discover** (the real map lives inside Saves).
- **For me** + **Admin** → folded into **Me**.
- **Add** screen (`TikTokParserScreen` on `activeTab==="add"`) → retired; it's a
  dead route and capture unifies under the FAB.

### Capture FAB

A floating circular **＋** that sits *over* content, above the nav bar, and opens
the existing "Save a place" sheet (Screenshot / Link / Manual) from any tab.

```
┌─────────────────────────────┐
│  Saves                       │
│  Restaurants (8)        →    │
│  Bars (5)               →    │
│  Cafés (3)          ┌─────┐  │
│                     │  +  │  │ ← floats bottom-right, above nav
│                     └─────┘  │
├─────────────────────────────┤
│  🔍   📌   📋   👥   🙂      │
└─────────────────────────────┘
```

**Why FAB over an inline nav +:** capture is the app's #1 action ("I saw a place,
save it"), and a FAB gives it the most weight without spending a nav slot.
**Caveat:** pad the bottom of scroll lists so the FAB never hides the last card.

---

## 3. Screen-by-screen

### ① Discover (home / landing)

```
┌─────────────────────────────┐
│  Curated London          🙂 │
│  ┌─────────────────────┐    │
│  │  ✦ Plan my day/night │←── launches the 8-Q quiz
│  └─────────────────────┘    │
│  Trending this week         │
│  ┌────┐ ┌────┐ ┌────┐       │
│  │ img│ │ img│ │ img│  →     │
│  └────┘ └────┘ └────┘       │
│  By area · By vibe          │
│  [Soho] [East] [Date night] │
│  ┌──────────────────────┐   │
│  │ curated pick card     │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

Today's Discover feed + the plan-creation CTA. Where a user with zero saves still
finds value.

### ② Saves

```
┌─────────────────────────────┐
│  Saves                  [+]  │
│  ┌───────────────────────┐   │
│  │  · ·    📍  · ·        │   │ ← map-peek strip (live, all pins)
│  │   ·  ·     ·    Open ›│   │   tap → full-screen map
│  └───────────────────────┘   │
│  [ Lists | Calendar ]        │ ← Map leaves the pill row (it's above)
│  Restaurants (8)        →    │
│  Bars (5)               →    │
│  ┌─ when a bar folder open ─┐│
│  │  🍸 Build a bar crawl →  ││ ← contextual launcher
│  └──────────────────────────┘│
└─────────────────────────────┘
```

Capture (via FAB), organize (Lists), Map (peek + full), Calendar, per-spot
notes/dates. Bar-crawl **launches** here from bar folders; the **result** lands
in Plans.

**Map prominence:** a persistent ~140px live map strip sits at the top of Saves
showing every pin, tap to expand. The map is the first thing you see, one tap to
full, and Lists stay one tap away. (Chosen over a full map-first canvas for far
less build cost.)

### ③ Plans

```
┌─────────────────────────────┐
│  Plans          [+ New plan]│←── also launches the quiz
│  ┌──────────────────────┐   │
│  │ 🗺️  Fri night · Soho  │   │
│  │     6 stops · →       │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ 🍸  Shoreditch crawl  │   │ ← bar crawls live here too
│  └──────────────────────┘   │
└─────────────────────────────┘
```

All itineraries + bar-crawl results. One name: these are all "Plans."

### ④ People (no change — already coherent)

```
┌─────────────────────────────┐
│  People                      │
│  🔗 Your invite link         │
│  ─────────────────────────── │
│  Bucket lists    [+ New list]│
│  ✨ Date spots   3/12 ▓▓░    │
│  ─────────────────────────── │
│  Shared with you (2)         │
│  Connected (4)               │
└─────────────────────────────┘
```

### ⑤ Me (new)

```
┌─────────────────────────────┐
│  🙂  Jahnvi                  │
│      jahnvi@…                │
│  ─────────────────────────── │
│  🎯 For me (tune picks)   →  │ ← today's "prefs" tab
│  🔔 Notifications         →  │
│  ⚙️  Account & settings   →  │
│  ⚙️  Admin                →  │ ← only if isAdmin
│  ↪  Sign out                 │
└─────────────────────────────┘
```

---

## 4. Calendar — "Your London agenda"

**Reframe:** Lists answer *"what have I collected?"*, Map answers *"where are
they?"*, Calendar should answer **"what am I doing, and when?"** Today it only
shows dated spots, one-way. Make it a unified agenda across four source types,
with two-way linking.

### Four sources (today only #1–#2 are shown)

| Source | On calendar today? | Plan |
|---|---|---|
| Dated **events** (`is_event`) | ✅ | keep |
| **Spots** with `visit_date` | ✅ | keep |
| **Plans / itineraries** | ❌ | schedule a plan to a date → one block, expands to stops |
| **Bucket-list items** | ❌ | give an item a target date → "we're doing this Sat" |

### Link both directions

**Object → Calendar ("Schedule"):**
- Spot detail → "Add to your calendar" (`visit_date`) — already exists.
- Plan card / Result screen → **"Schedule this plan"** → pick a date; optionally
  drop its stops onto that day.
- Bucket-list item → **"Plan a date"** → sets a target date, shows on the
  calendar, and notifies the other list members.

**Calendar → Object ("＋ Add to this day"):** this is what makes it *active*.

```
┌─────────────────────────────┐
│  ‹      June 2026        ›   │
│  M  T  W  T  F  S  S         │
│        ▓4    6•  7           │ ← dots colour-coded by type
│  9 10 11 12• 13 14•          │
│  ─── Sat 14 June ───────────│
│  🗺️ Soho night · 6 stops  →  │ ← a scheduled PLAN
│  📌 Sketch (lunch)          │ ← a spot
│  ✨ Sky Garden (bucket list)│ ← a blist item w/ target date
│  ┌─────────────────────┐    │
│  │  ＋ Add to this day   │   │ → sheet:
│  └─────────────────────┘    │    • From your saves
│                             │    • A plan you've made
│                             │    • A bucket-list item
│                             │    • Build a plan for this day →
└─────────────────────────────┘
```

Knocks out roadmap item **4 (in-app calendar + scheduling)**, and lays rails for
**6 (gcal export — already per-item)** and **7 (reminders)**.

---

## 5. Where every current feature goes

| Today | Tomorrow |
|---|---|
| **Plan** tab (quiz) | "Plan my day" CTA on **Discover** + "New plan" on **Plans** |
| **Plans** | **Plans** (now also holds bar crawls) |
| **Saves** (folders/map/cal/capture/crawl) | **Saves**; capture via FAB; crawl result → Plans; map promoted to peek strip |
| **Map** (curated) | **Discover** (renamed) |
| **People** | **People** (unchanged) |
| **For me** | **Me → For me** |
| **Admin** | **Me → Admin** |
| Orphan **Add** screen | **Deleted** |

---

## 6. Open decisions

1. **Default landing tab** — Discover for first-run vs. Saves for returning users.
2. **Calendar data** — plans stay in `localStorage` (simple, v1) vs. move to
   Supabase (cross-device + friend reminders). Lean: local for v1.
3. **Schema adds the agenda needs:** `target_date` on `shared_list_items`,
   `scheduled_date` on plans.

---

## 7. Suggested build phases

- **(a) Zero-risk:** rename Map→Discover, delete the orphan Add screen, add the
  capture FAB.
- **(b) Low-risk:** add the **Me** tab; move For-me + Admin into it.
- **(c) Medium:** Map-peek strip in Saves.
- **(d) Bigger:** merge Plan into Discover (CTA) + Plans ("New plan").
- **(e) Feature:** Calendar full agenda — schema adds, scheduling actions on
  plans/bucket-list items, "＋ Add to this day."
