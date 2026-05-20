# ProMarketing LTD — Web Platform Design Spec

**Date:** 2026-05-20
**Status:** Approved (brainstorming complete, ready for implementation planning)
**Authors:** Brainstorm session with user

---

## Overview

A futuristic marketing website for ProMarketing LTD — an AI automation agency serving businesses of any size and industry. The site presents the agency as forward-looking and technologically ahead. Bookings happen entirely through an embedded Cal.com popup; bookings are mirrored to Supabase via webhook for an internal admin dashboard.

## Goals

- Convert visitors to consultation bookings via a single, dominant CTA.
- Communicate "we look to the future" through bold visual identity and motion design.
- Provide the agency owner an authenticated admin dashboard to review bookings and lead analytics.
- Be production-grade, performant on mobile, and fully accessible.

## Non-goals

- No public pricing or pricing tiers.
- No custom contact form. Cal.com captures all lead data.
- No client-facing login or portal.
- No CMS at launch. Content is hard-coded in code; editable via PRs.
- No multi-language support. Bulgarian only.

---

## Technology Stack

- **Framework:** Next.js 16 (App Router) with React 19
- **Language:** TypeScript 5
- **Styling:** TailwindCSS 4 + shadcn/ui primitives
- **Database:** PostgreSQL via Supabase (with Row-Level Security)
- **Auth:** Supabase Auth (Email + Google OAuth) for admin
- **Booking:** Cal.com (embed popup + webhook integration)
- **Motion:** Motion library (Framer Motion successor, v11+)
- **3D:** Three.js + @react-three/fiber + @react-three/drei (Hero orb)
- **Validation:** Zod (webhook payload)
- **Hosting:** Vercel (production + preview deploys)

---

## Information Architecture

### Routes

```
/                        Public landing page (long-scroll)
/admin/login             Supabase Auth UI (email + Google)
/admin                   Protected dashboard (summary)
/admin/bookings          Detailed bookings table with filters
/admin/settings          Cal.com link, webhook secret display
/api/webhooks/cal        POST endpoint, HMAC-verified
/api/health              Health check
```

### Landing page sections (in order)

1. **Navbar** — floating glass, logo left, 4 nav links (Услуги, Процес, За кого, FAQ), primary CTA right
2. **Hero** — full-viewport with aurora + neural mesh background, large headline, primary + secondary CTA
3. **Trust Strip** — animated counters: "100+ автоматизирани процеса", "24/7 работа", "60% спестено време"
4. **Services** — bento grid of 6 AI automation cards (AI чат агенти, Email/SMS, CRM, гласови агенти, lead qualification, content)
5. **Process** — 4-step vertical flow with animated SVG line draw
6. **Industries** — horizontal scroll or tab grid (e-commerce, имоти, ресторанти, мед. клиники, юристи, фитнес, B2B)
7. **Why ProMarketing** — 3-column differentiator block
8. **FAQ** — accordion with 6-8 questions
9. **Final CTA** — high-contrast section with one button
10. **Footer** — logo, bio, contact, social, copyright, privacy link

There are no pricing or packages sections.

---

## Visual Design System

### Color tokens (CSS variables)

```css
--bg-void:       #030308   /* main background, blacker than black */
--bg-deep:       #0a0a1f   /* lifted surfaces */
--bg-glass:      rgba(255,255,255,0.03)  /* + backdrop-blur(20px) */

--accent-cyan:   #06b6d4   /* primary, AI/data */
--accent-violet: #7c3aed   /* secondary, premium */
--accent-magenta: #ec4899  /* rare accent, hover/edge only */

--text-primary:   #f5f7ff
--text-secondary: #a0a8c0
--text-tertiary:  #4a5070

--border:        rgba(124,58,237,0.15)
--border-bright: rgba(6,182,212,0.4)
```

### Typography

- **Display:** Syne (700, 800) — characterful, technological
- **Body:** Inter Tight (400, 500, 600) — high legibility at small sizes
- **Mono:** JetBrains Mono (400, 600) — counters, code badges
- All fonts self-hosted via `next/font/local` from `public/fonts/`.
- Hero h1: clamp(56px, 8vw, 120px). h2: clamp(40px, 5vw, 72px). Body: 17px.

### Signature visual effects

1. **Aurora mesh background** — 3 layered radial gradient blobs, slow drift (~20s loop), `mix-blend-mode: screen`.
2. **Grid overlay** — 1px lines on 80px grid, opacity 0.06.
3. **Glow on hover** — `box-shadow: inset 0 0 30px rgba(6,182,212,0.1), 0 0 40px rgba(6,182,212,0.15)`.
4. **Holographic border** — animated 1px conic gradient, slow rotation, on primary CTA.
5. **Particle field** — ~40 light points, parallax to mouse, canvas-rendered.
6. **Scroll reveal** — small y-translate + fade, staggered 100ms.
7. **Custom cursor** — small cyan dot replaces default cursor over interactive elements.
8. **Number counter** — animated when entering viewport, easeOut with slight overshoot.

### Innovative animations (added per user request)

#### Hero
- **Spotlight cursor** — large cyan-violet light sphere follows cursor with 300ms ease-out lag.
- **Text scramble headline** — decodes from random symbols to final text over 800ms on load.
- **Floating 3D orb** — Three.js shader sphere, iridescent surface, slow rotation, mouse-reactive.
- **Particle constellation** — points connect with thin lines when in proximity.

#### Global
- **Magnetic buttons** — primary CTA attracts cursor within 60px radius (spring physics).
- **Tilt cards with depth** — 3D perspective tilt on hover, icons parallax forward.
- **Holographic shimmer on text** — animated gradient (cyan → violet → cyan) sweeps across headings.
- **Glow follow** — conic gradient border rotation (4s loop) + light point following mouse along card edge.
- **Scroll progress line** — fixed right-edge gradient line (cyan → violet) tracks page progress.
- **Letter-by-letter blur-in** for Hero h1; **word-by-word fade** for sub-copy.

#### Process section
- **SVG path draw** — vertical connector line draws on scroll, cyan glow.
- **Step number morphing** — 01 → 02 → 03 morph when entering viewport.

#### Services section
- **Live "data feed"** in one card — typed-in chat messages cycling through 4 examples.
- **Animated icons** — Lottie or CSS-animated (gears spinning, bubbles pulsing).

#### Trust Strip
- **Counter ramp** — non-linear easing, accelerating mid-animation, slight overshoot.

#### Section transitions
- **Glitch frame dividers** — 80px decorative scan-line dividers between sections, activated on entry.

#### Final CTA
- **Pulse + ripple rings** — 3 layered pulse rings around the primary button.
- **Confetti on booking confirmed** — fine cyan/violet/magenta confetti via canvas-confetti.

#### Page load
- **Logo iris-reveal** — 600ms intro overlay that collapses from center.

### Motion philosophy

- CSS-only for hover/transition/cascade.
- Motion library only for scroll reveals and Hero parallax/orb.
- No video backgrounds. No auto-playing animations beyond ambient (aurora, particles).
- Never more than 2 things in motion simultaneously per viewport.
- `prefers-reduced-motion: reduce` disables all motion effects.

---

## Component Architecture

### File structure

```
prom-marketing/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── page.tsx
│   │   ├── bookings/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       ├── webhooks/cal/route.ts
│       └── health/route.ts
├── components/
│   ├── landing/
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── TrustStrip.tsx
│   │   ├── Services.tsx
│   │   ├── Process.tsx
│   │   ├── Industries.tsx
│   │   ├── WhyUs.tsx
│   │   ├── FAQ.tsx
│   │   ├── FinalCTA.tsx
│   │   └── Footer.tsx
│   ├── effects/
│   │   ├── AuroraBackground.tsx
│   │   ├── ParticleField.tsx
│   │   ├── ShaderOrb.tsx
│   │   ├── SpotlightCursor.tsx
│   │   ├── TextScramble.tsx
│   │   ├── MagneticButton.tsx
│   │   ├── ScrollProgress.tsx
│   │   ├── SectionReveal.tsx
│   │   ├── HolographicText.tsx
│   │   ├── TiltCard.tsx
│   │   └── CounterRamp.tsx
│   ├── admin/
│   │   ├── BookingsTable.tsx
│   │   ├── StatsCards.tsx
│   │   └── LoginForm.tsx
│   └── ui/ (shadcn)
│       ├── button.tsx
│       ├── card.tsx
│       ├── accordion.tsx
│       ├── dialog.tsx
│       ├── table.tsx
│       └── toast.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── cal/
│   │   ├── verify-webhook.ts
│   │   ├── embed.ts
│   │   └── types.ts
│   └── utils.ts
├── hooks/
│   ├── use-mouse-position.ts
│   ├── use-scroll-reveal.ts
│   ├── use-counter.ts
│   ├── use-magnetic.ts
│   └── use-reduced-motion.ts
├── supabase/
│   └── migrations/
│       ├── 001_create_bookings.sql
│       ├── 002_create_webhook_log.sql
│       └── 003_admin_role_check.sql
├── public/
│   ├── fonts/
│   └── og-image.png
├── middleware.ts
├── .env.example
├── tailwind.config.ts
└── package.json
```

### Key design decisions

- **Server Components by default.** Only effects, magnetic, tilt, scramble, and admin-interactive components use `"use client"`.
- **Effects as wrappers.** Components in `effects/` accept `children` and decorate them, enabling composition.
- **Reduced motion respected** via `useReducedMotion()` in every effect.
- **Self-hosted fonts** via `next/font/local` to eliminate external font requests.
- **Cal.com via `@calcom/embed-react`** in popup mode; CTA opens with `cal.openPopup()`.
- **Webhook flow:** Cal.com → POST `/api/webhooks/cal` → HMAC verify → upsert into `bookings` → 200. All attempts logged into `cal_webhook_log`, including failures.
- **Admin auth gate:** middleware checks session AND email membership in `ALLOWED_ADMIN_EMAILS`. Non-allowed users are signed out with a toast.

---

## Data Model

### Tables

#### `bookings`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| cal_booking_id | text | Unique, from Cal.com payload |
| attendee_name | text | |
| attendee_email | text | |
| attendee_phone | text | Nullable |
| scheduled_at | timestamptz | UTC start time |
| duration_minutes | int | |
| status | text | `confirmed`, `rescheduled`, `cancelled` |
| raw_payload | jsonb | Full Cal.com event payload |
| created_at | timestamptz | default `now()` |
| updated_at | timestamptz | default `now()` |

Indexes: `cal_booking_id` (unique), `scheduled_at`, `attendee_email`.

#### `cal_webhook_log`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_type | text | `BOOKING_CREATED`, etc. |
| payload | jsonb | |
| signature_valid | boolean | |
| processed_at | timestamptz | default `now()` |
| error | text | Nullable |

### RLS policies

- `bookings`: SELECT allowed only for sessions whose email is in `ALLOWED_ADMIN_EMAILS`. INSERT/UPDATE only via service role.
- `cal_webhook_log`: same as bookings.
- Service role bypasses RLS by design; used exclusively in the webhook route.

### Admin authorization

- `ALLOWED_ADMIN_EMAILS` is a comma-separated environment variable (server-side only).
- A SQL function `is_admin_email(email text) returns boolean` checks membership and is called from RLS policies via JWT claim.

---

## Booking Flow

1. Visitor clicks any "Запази среща" CTA on the landing page.
2. `cal.openPopup({ calLink: 'promarketing/consultation' })` opens an embedded modal.
3. Visitor picks date, time, fills name/email/phone in Cal.com's form.
4. Cal.com persists the booking and triggers `BOOKING_CREATED` webhook.
5. `POST /api/webhooks/cal` receives the payload:
   - Verifies HMAC signature against `CAL_WEBHOOK_SECRET`. If invalid → 401, logged.
   - Parses with Zod schema. If invalid → 400, logged.
   - Upserts into `bookings` by `cal_booking_id`.
   - Logs success or error into `cal_webhook_log`.
   - Returns 200.
6. Cal.com sends confirmation email to visitor and calendar invite (no extra work from us).
7. On success in the popup, Cal.com's `bookingSuccessful` callback triggers confetti on the page.

---

## Admin Dashboard

### Pages

- **`/admin/login`** — Supabase Auth UI (email magic link + Google). After auth, server checks `ALLOWED_ADMIN_EMAILS`; if not allowed, sign out + toast.
- **`/admin`** — summary with stats cards: total bookings this week, this month, upcoming count, latest 5 bookings list.
- **`/admin/bookings`** — paginated, filterable table (date range, status, search). Export CSV button.
- **`/admin/settings`** — webhook URL display (read-only), webhook secret display (masked), Cal.com event slug, list of allowed admin emails (read-only).

### Components

- `StatsCards` (RSC) — fetches counts on the server.
- `BookingsTable` (client) — uses TanStack Table for sorting/pagination.
- `LoginForm` (client) — shadcn form + Supabase Auth client.

---

## Performance Targets

- **LCP < 2.5s** on mobile (3G simulation).
- **CLS < 0.1**.
- **TBT < 200ms**.
- **Total client JS < 250kb** on landing, excluding `ShaderOrb` which is dynamic-imported only on desktop with `window.matchMedia('(min-width: 1024px)')` and `(prefers-reduced-motion: no-preference)`.
- Hero images use `next/image` with `priority`. Other images lazy-load.

## Accessibility Requirements

- All CTAs have `aria-label` when visual-only.
- Focus indicators: visible cyan ring on keyboard navigation.
- `prefers-reduced-motion: reduce` disables all motion effects (aurora frozen, no scramble, no orb rotation, no scroll animations).
- Contrast ratios: ≥ 4.5:1 for body text, ≥ 3:1 for large display text.
- All accordion FAQ items keyboard-navigable.
- Skip-to-content link for screen readers.

## Error Handling

| Location | Error | Behavior |
|----------|-------|----------|
| `/api/webhooks/cal` | Invalid HMAC | 401, log in `cal_webhook_log` |
| `/api/webhooks/cal` | Duplicate `cal_booking_id` | Upsert (idempotent), 200 |
| `/api/webhooks/cal` | DB write failure | 500, log error, Cal.com auto-retries |
| `/admin/login` | Non-allowed email | Sign out + toast "Нямате достъп" |
| Admin pages | Expired session | Middleware redirects to `/admin/login` |
| Landing | Cal.com embed fails to load | Fallback `<a>` to `https://cal.com/{username}/{slug}` |
| Landing global | Runtime error | `app/error.tsx` minimal grace page with "Опитай отново" button |

---

## Testing Strategy

- **Vitest unit tests:**
  - `lib/cal/verify-webhook.ts` — valid signature, invalid signature, missing header.
  - `lib/utils.ts` — date/number formatters.
- **Vitest integration tests:**
  - `POST /api/webhooks/cal` with valid payload + valid HMAC → 200, row inserted.
  - Invalid HMAC → 401, no insert.
  - Duplicate `cal_booking_id` → upsert, no error.
- **Playwright smoke tests:**
  - Landing renders, hero text visible, "Запази среща" button opens Cal.com popup.
  - `/admin/bookings` redirects unauthenticated user to `/admin/login`.
  - Login with allowed email → redirects to `/admin` and shows stats.
- **Type safety as acceptance criterion:** `tsc --noEmit` passes in CI.

## CI/CD

- GitHub Actions on every PR: `lint`, `tsc --noEmit`, `vitest`, `playwright --headless`.
- Vercel auto-deploys: previews on PR, production on merge to `main`.

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=                # server-only

# Cal.com
NEXT_PUBLIC_CAL_USERNAME=                 # e.g. "promarketing"
NEXT_PUBLIC_CAL_EVENT_SLUG=               # e.g. "consultation"
CAL_WEBHOOK_SECRET=                       # server-only

# Admin
ALLOWED_ADMIN_EMAILS=                     # comma-separated, server-only

# Site
NEXT_PUBLIC_SITE_URL=https://promarketing.bg
```

## External Service Setup (one-time, user-performed)

1. **Cal.com account:**
   - Sign up at cal.com
   - Create event type "Безплатна консултация" (30 min)
   - Webhooks → Add → URL: `https://{site}/api/webhooks/cal` → generate secret → copy to env
   - Connect Google Calendar for auto-sync

2. **Supabase project:**
   - Create project at supabase.com
   - Run migrations from `supabase/migrations/`
   - Enable Email + Google providers in Auth settings
   - Set Site URL and redirect URLs in Auth → URL Configuration
   - Copy `URL`, `anon key`, `service role key` into env

3. **Vercel:**
   - `vercel link` connects repo
   - Add all env vars in Vercel dashboard
   - Configure custom domain when available

---

## Open Items for Implementation

- Final copy for hero headline and sub-copy — placeholders used during build, owner refines.
- Specific FAQ questions — 6-8 standard ones drafted, owner approves.
- Industry list — 7 industries provisional; owner confirms or adjusts.
- Service icon designs — initial set in Lucide; can be customized later.
- Logo — text wordmark generated initially; can be replaced with custom logo file.
- Privacy policy and terms — placeholder text linked from footer; owner adds real content.
