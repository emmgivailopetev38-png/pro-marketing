# Partner one-pager (`/partneri`) — design spec

**Date:** 2026-05-21
**Audience:** Marketing agencies in the hotel & real-estate verticals
**Goal:** A short white-label pitch — they sell AI automations, ProMarketing executes.
**Format:** One web page + downloadable A4 PDF with identical content.

## Audience & framing

Recipients are agency owners / account leads at marketing agencies that serve hotels and real-estate firms. They already sell marketing services; the missing piece is execution capacity for AI automation work. The deck positions ProMarketing as a white-label execution partner — under their brand or co-branded, their call.

The first concrete recipient is **Synergy Consult** (Plovdiv), a hotel-focused agency with 100+ hotel clients.

Pricing is intentionally absent from public collateral. Every project is scoped on a discovery call and quoted per the volume of work.

## Page sections

1. **Hero** — eyebrow `01 · Партньорска програма`, H1 *"Ние сме твоят execution екип за AI автоматизация."*, sub-copy explaining the white-label model in one sentence, primary CTA **"Изтегли PDF"**, secondary CTA **"Запази discovery call"** (Cal.com popup).
2. **Услуги** — 6 cards, icon + one-line description:
   - AI чат ботове (booking за хотели · qualified inquiries за имоти)
   - AI генератор на съдържание (social posts в брандовия глас на клиента)
   - Lead capture + CRM интеграция
   - Мулти-езикова комуникация (BG/EN/DE/RU)
   - Автоматизирани отговори на ревюта (TripAdvisor, Booking, Google)
   - Финансова автоматизация (фактуриране, отчети)
3. **Процес** — 3 numbered steps on one line: *Discovery (30 мин)* → *Оферта по scope* → *Изпълнение 30–60 дни*.
4. **CTA bar** — repeat of primary/secondary CTAs, phone, email.

No testimonials, no logos, no pricing — kept deliberately short so the page is scannable in under a minute.

## Visual language

Same dark tech aesthetic as `/oferta/eduard`:
- Background `var(--color-bg-void)` with subtle cyan radial glow
- Editorial font for H1/H2, mono font for eyebrows and metadata, body font elsewhere
- Cyan (`--color-accent-cyan`) + violet (`--color-accent-violet`) accents
- No heavy shaders or 3D — minimalism matches B2B tone

## PDF generation

- A single API route `app/api/partneri/pdf/route.ts` returns the PDF on GET
- Built with `@react-pdf/renderer` (no headless browser; runs anywhere)
- A4 portrait, one page, single column with a 2-col services grid
- Same copy as the web page, slightly tighter
- Filename: `ProMarketing-Partneri.pdf`
- The hero "Изтегли PDF" button is a plain `<a href="/api/partneri/pdf" download>` link

## File layout

```
app/partneri/page.tsx              ← server component
app/partneri/PartneriHero.tsx      ← "use client" (Cal.com popup)
app/partneri/PartneriServices.tsx  ← static server component
app/partneri/PartneriProcess.tsx   ← static server component
app/partneri/PartneriClosing.tsx   ← "use client" (Cal.com popup)
app/api/partneri/pdf/route.ts      ← @react-pdf/renderer
lib/pdf/partneri-document.tsx      ← shared PDF document component
public/partneri-og.png             ← OG image (optional, can defer)
```

Static export — no dynamic data fetching.

## Out of scope

- Lead capture form on the page itself (use Cal.com booking, same as everywhere else)
- Visible pricing or commission disclosure
- Vertical-specific sub-pages (single page covers both hotels and realty)
- Analytics events beyond the existing Meta Pixel PageView
