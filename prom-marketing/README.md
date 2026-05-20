# ProMarketing LTD

Marketing site + admin dashboard for an AI automation agency.

## Stack
Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui, Supabase, Cal.com, Motion, Three.js.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

Visit http://localhost:3000.

## Environment

See `.env.example`. All variables are required for full functionality:
- Supabase project URL + anon + service-role keys.
- Cal.com username + event slug + webhook secret.
- `ALLOWED_ADMIN_EMAILS` — comma-separated list of emails permitted to access `/admin`.

## Database

Migrations live in `supabase/migrations/`. Apply via Supabase Dashboard SQL editor or CLI:

```bash
supabase db push   # if using Supabase CLI linked to your project
```

After migrations, set the Postgres custom config:

```sql
alter database postgres set app.allowed_admin_emails = 'owner@promarketing.bg,other@promarketing.bg';
select pg_reload_conf();
```

## Cal.com setup

1. Sign up at cal.com.
2. Create event "Безплатна консултация" — 30 min.
3. Webhooks → Add → URL `https://<your-domain>/api/webhooks/cal`, secret → copy into `CAL_WEBHOOK_SECRET`.
4. Subscribe to events: `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm run typecheck` | TS check, no emit |
| `npm test` | Vitest unit + integration |
| `npm run test:e2e` | Playwright smoke tests |

## Deployment

Hosted on Vercel. `main` auto-deploys to production. PRs get preview URLs.
