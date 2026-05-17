# Family DinnerTime — Implementation Plan

## Context

Stephen wants a mobile-first PWA for family weekly dinner planning. The app lets families collaboratively plan dinners, manage favorite dishes, auto-generate shopping lists, and get AI meal suggestions — all shared via a simple family link (no accounts needed). The Figma prototype shows a warm orange/cream aesthetic with a weekly grid, dish sidebar, shopping list, and print support.

**Build in the existing MealTime repo** — replace current placeholder code, keep git history.

**Stack**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase + Vercel  
**Design**: Warm palette — accent `#D97757`, bg `#F5F0E8`, cards `#FDFAF4`, fonts Lora + DM Sans  
**Scope**: Dinner only (one meal slot per day)

---

## Supabase Schema

### families
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `gen_random_uuid()` |
| name | TEXT NOT NULL | Default `'Our Family'` |
| share_code | TEXT UNIQUE NOT NULL | 8-char nanoid |
| created_at | TIMESTAMPTZ | `now()` |
| updated_at | TIMESTAMPTZ | `now()` |

### dishes
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| family_id | UUID FK → families | CASCADE delete |
| name | TEXT NOT NULL | |
| tags | TEXT[] | `{quick, vegetarian, kid-friendly, ...}` |
| source_url | TEXT | Original recipe URL |
| ingredients | JSONB | `[{name, quantity, unit, category}]` |
| instructions | TEXT | Plain text / markdown |
| prep_time | INTEGER | Minutes |
| cook_time | INTEGER | Minutes |
| servings | INTEGER | Default 4 |
| image_url | TEXT | |
| notes | TEXT | |
| is_favorite | BOOLEAN | Default true |
| created_at / updated_at | TIMESTAMPTZ | |

### meal_plans
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| family_id | UUID FK → families | CASCADE delete |
| dish_id | UUID FK → dishes | SET NULL on delete |
| meal_date | DATE NOT NULL | |
| custom_name | TEXT | Free-text if no dish_id |
| position | INTEGER | Default 0 |
| created_at | TIMESTAMPTZ | |
| UNIQUE | | `(family_id, meal_date, position)` |

### shopping_items
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| family_id | UUID FK → families | CASCADE delete |
| name | TEXT NOT NULL | |
| quantity | TEXT | e.g. "2 lbs" |
| category | TEXT | Aisle grouping, default `'Other'` |
| is_checked | BOOLEAN | Default false |
| source | TEXT | `'manual'` or `'auto'` |
| meal_plan_id | UUID FK → meal_plans | SET NULL on delete |
| created_at | TIMESTAMPTZ | |

**Realtime**: Enable on `meal_plans`, `shopping_items`, `dishes`  
**RLS**: Skip for V1 — API routes validate family_id from cookie against share_code

---

## File Structure

```
src/
  app/
    page.tsx                    # Landing: Create Family / Join Family
    [familyCode]/
      layout.tsx                # Load family, FamilyProvider, realtime setup
      page.tsx                  # Weekly meal plan (main view)
      dishes/page.tsx           # Dish library (favorites)
      shopping/page.tsx         # Shopping list
      settings/page.tsx         # Family name, share code, QR
    api/
      family/create/route.ts
      family/join/route.ts
      dishes/route.ts           # GET, POST
      dishes/[id]/route.ts      # PATCH, DELETE
      meal-plan/route.ts        # GET, POST
      meal-plan/[id]/route.ts   # DELETE
      shopping/route.ts         # GET, POST
      shopping/[id]/route.ts    # PATCH, DELETE
      shopping/generate/route.ts # Auto-generate from plan
      ai/suggest/route.ts       # AI meal suggestions
      ai/import-url/route.ts    # Recipe URL extraction
  components/
    layout/
      BottomNav.tsx             # Plan | Dishes | Shop tabs
      Header.tsx                # Title, week nav, print btn
    meal-plan/
      WeekGrid.tsx              # 7 DayCards vertical (mobile) / horizontal (desktop)
      DayCard.tsx               # Day name, date, today highlight, meal slot
      MealSlot.tsx              # Assigned dish or "Tap to add"
      DishPicker.tsx            # Bottom sheet to pick a dish
      WeekNavigation.tsx        # Prev/Next week arrows
    dishes/
      DishList.tsx              # Scrollable list with search
      DishCard.tsx              # Name + tag badges
      DishForm.tsx              # Bottom sheet: add/edit dish
      TagFilter.tsx             # Horizontal tag chip scroll
    shopping/
      ShoppingList.tsx          # Category-grouped items
      CategoryGroup.tsx         # Collapsible aisle section
      AddItemForm.tsx           # Text input + Add
      ShoppingItem.tsx          # Checkbox + name + swipe-delete
    shared/
      BottomSheet.tsx           # Reusable bottom sheet modal
      Button.tsx
      Badge.tsx
      EmptyState.tsx
  hooks/
    useFamily.ts                # Current family context
    useDishes.ts                # Dish CRUD + realtime
    useMealPlan.ts              # Week plan + realtime
    useShoppingList.ts          # Shopping CRUD + auto-generate
    useWeekNavigation.ts        # Week start/end, today
  lib/
    supabase/client.ts          # Browser client
    supabase/server.ts          # Server client (service role)
  types/
    database.ts                 # All TypeScript types
public/
  manifest.json
  icons/                        # PWA icons (192, 512, maskable)
  sw.js                         # Service worker (generated by Serwist)
supabase/
  migrations/
    001_initial_schema.sql
```

---

## Family Sharing System

1. Creator visits app → "Create Family" → enters name
2. Server generates 8-char `share_code` (nanoid)
3. Redirect to `/xK9mP2qR` (the family URL)
4. Creator shares link: `dinnertime.vercel.app/xK9mP2qR`
5. Family member opens link → sees "Join [Family Name]?" → clicks Join
6. Both devices see the same plan in realtime
7. `familyCode` stored in `localStorage` + `cookie` for persistence
8. Middleware redirects `/` to `/[code]` if cookie exists

---

## Phased Build Order

### Phase 1: Core (first priority)
**Goal**: Working meal planner you can use tonight.

1. **Project setup** — Next.js + TypeScript + Tailwind (custom theme), Supabase project + migration, deploy skeleton to Vercel
2. **Family onboarding** — Landing page, create/join API routes, cookie-based session, redirect middleware
3. **Dish management** — DishList, DishCard, DishForm (bottom sheet), CRUD API routes, tag badges
4. **Weekly grid** — WeekNavigation, WeekGrid (7 DayCards), tap-to-assign via DishPicker bottom sheet, Clear Week
5. **Basic shopping list** — flat list with checkboxes, add item, swipe-to-delete, checked items sink to bottom
6. **Bottom navigation** — 3 tabs (Plan, Dishes, Shop) with active state + badge count on Shop
7. **Mobile layout** — single column, safe area insets, 44px touch targets, bottom sheets (not modals)

### Phase 2: Smart Features
**Goal**: Ingredients, auto shopping list, categories, print, realtime sync.

1. **Ingredients on dishes** — extend DishForm with ingredient rows (name, qty, unit, category)
2. **Auto-generate shopping list** — API aggregates ingredients from planned meals, deduplicates, groups by aisle
3. **Category-grouped shopping** — collapsible aisle sections (Produce, Meat, Dairy, Pantry...)
4. **Tag filtering** — horizontal chip scroll on Dishes page, filter when planning
5. **Print view** — CSS `@media print`, clean table layout with week plan + shopping list
6. **Realtime sync** — Supabase subscriptions on `meal_plans`, `shopping_items`, `dishes`; optimistic updates; sync indicator

### Phase 3: AI Features
**Goal**: Smart suggestions and recipe URL import.

1. **AI meal suggestions** — Vercel AI SDK + Claude Sonnet, context = favorites + recent meals + day-of-week, returns 3 suggestions
2. **Recipe URL import** — paste URL → fetch HTML → Claude extracts name/ingredients/instructions → user reviews → save
3. **Suggestion history** — track accepted/rejected to improve future suggestions

### Phase 4: Polish & PWA
**Goal**: Installable, offline-capable, delightful.

1. **PWA** — manifest.json, icons, Apple meta tags, Serwist service worker, precache app shell
2. **Offline** — IndexedDB via Zustand persist, offline mutation queue, replay on reconnect
3. **Drag-and-drop** — @dnd-kit with touch sensor (long-press 200ms), drag dishes to day slots
4. **Animations** — Framer Motion for page transitions, bottom sheet springs, list item enter/exit
5. **Onboarding** — welcome screen, create family flow, share code + QR, tutorial tooltips

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| next, react, react-dom | Framework |
| @supabase/supabase-js, @supabase/ssr | Database + realtime |
| zustand | State management + offline persist |
| @dnd-kit/core, @dnd-kit/sortable | Drag and drop (Phase 4) |
| ai, @ai-sdk/anthropic | AI features (Phase 3) |
| serwist, @serwist/next | PWA service worker (Phase 4) |
| framer-motion | Animations (Phase 4) |
| date-fns | Date math |
| lucide-react | Icons |
| nanoid | Share code generation |
| zod | Runtime validation |

---

## Design Specs

| Breakpoint | Layout |
|-----------|--------|
| < 640px | Single column, bottom nav, vertical day cards, bottom sheets |
| 640–1024px | Two column (dish sidebar + content), bottom nav |
| > 1024px | Full desktop: sidebar + 7-col grid, top nav |

- Touch targets: 44px minimum (Apple HIG)
- Safe areas: `env(safe-area-inset-top/bottom)` for notched iPhones
- Bottom nav: 64px + safe area
- Font: Lora (headers/serif), DM Sans (body), DM Mono (quantities)

---

## Verification Plan

1. **iPhone Safari** — install PWA to home screen, verify full-screen standalone mode
2. **Family sharing** — create family on device A, share link to device B, verify both see same plan
3. **Realtime** — assign meal on device A, confirm it appears on device B within 2s
4. **Shopping list** — plan 3 dinners with ingredients, auto-generate list, verify grouping and dedup
5. **AI suggest** — request suggestions, verify they reference existing favorites and recent history
6. **URL import** — paste a recipe URL (e.g., AllRecipes), verify extracted name/ingredients/instructions
7. **Offline** — enable airplane mode, browse plan and check shopping items, reconnect and verify sync
8. **Print** — print weekly plan, verify clean layout with meals + shopping list
9. **Drag-and-drop** — long-press dish on iPhone, drag to day slot, verify assignment
