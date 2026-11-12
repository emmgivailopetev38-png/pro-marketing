import Link from "next/link";
import { BookingEmbed } from "@/components/booking/BookingEmbed";
import { VslChapters, VslPlayer, VslStickyCta } from "@/components/vsl/VslPlayer";
import { ivailoEventSlug } from "@/lib/team/split-rules";
import type { VslContent } from "@/lib/site/vsl";

const GEORGI_SLUG = "konsultacia-georgi";
const GEORGI_EMAIL = "george.mandadzhiev@gmail.com";
const BOOKING_ID = "chas";

/**
 * Страницата на един VSL. Линкът го праща Георги (клоузъра) на човека, с
 * когото говори — затова календарът по подразбиране е НЕГОВИЯТ
 * (`konsultacia-georgi`, Георги гост в поканата), а не 50/50-ът на /booking:
 * иначе половината от хората, които той е намерил, щяха да се запишат при
 * Ивайло. `?ot=ivailo` → календарът на Ивайло (когато той праща линка).
 * `?ime=Иван` → „Здравей, Иван 👋“ отгоре.
 */
export function VslLanding({ c, name, toIvailo }: { c: VslContent; name: string | null; toIvailo: boolean }) {
  const calLink = `promarketing/${toIvailo ? ivailoEventSlug() : GEORGI_SLUG}`;
  const host = toIvailo ? "Ивайло" : "Георги от екипа на Ивайло";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0b0b0d] pb-24 text-[#f5f5f7] md:pb-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[900px]"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(250,204,21,0.10) 0%, transparent 55%), radial-gradient(ellipse at 90% 40%, rgba(250,204,21,0.05) 0%, transparent 50%)",
        }}
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 pt-5 sm:px-6 md:pt-8">
        <Link href="/" className="font-display text-sm font-bold tracking-tight text-white/90">
          Pro<span className="text-[#facc15]">Marketing</span>
        </Link>
        <a
          href={`#${BOOKING_ID}`}
          className="rounded-full border border-[#facc15]/40 px-4 py-1.5 text-xs font-semibold text-[#facc15] transition hover:bg-[#facc15]/10"
        >
          {c.bookingTitle}
        </a>
      </header>

      {/* Телефон и таблет: заглавие → видео → останалото. Лаптоп: видео вляво, текст вдясно. */}
      <section className="relative mx-auto grid max-w-6xl gap-6 px-4 pb-14 pt-6 [grid-template-areas:'head'_'video'_'rest'] sm:px-6 md:pt-10 lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-x-14 lg:gap-y-8 lg:pt-12 lg:[grid-template-areas:'video_head'_'video_rest']">
        <div className="mx-auto w-full max-w-2xl [grid-area:head] lg:mx-0 lg:max-w-none lg:self-end">
          {name && <p className="mb-3 text-lg font-semibold text-white">Здравей, {name} 👋</p>}
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#facc15]">{c.kicker}</p>
          <h1 className="font-display text-[clamp(28px,6.4vw,48px)] font-extrabold leading-[1.05] tracking-tight lg:text-[clamp(34px,3.6vw,54px)]">
            {c.title.before}
            <span className="text-[#facc15]">{c.title.accent}</span>
            {c.title.after}
          </h1>
        </div>

        <div className="[grid-area:video] lg:sticky lg:top-6 lg:self-start">
          <VslPlayer vsl={c.slug} src={c.video} poster={c.poster} endHref={`#${BOOKING_ID}`} endLabel={c.bookingTitle} />
          <p className="mx-auto mt-3 max-w-[420px] text-center text-xs leading-relaxed text-[#8f8f99]">
            🤖 Гласът във видеото е AI клонинг на гласа на Ивайло. Кадрите „📍 РЕАЛЕН КАДЪР“ са истински, демата са с
            примерни данни.
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl [grid-area:rest] lg:mx-0 lg:max-w-none lg:self-start">
          <p className="text-base leading-relaxed text-[#c9c9d1] md:text-lg">{c.lead}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={`#${BOOKING_ID}`}
              className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#facc15] px-7 py-3.5 text-base font-bold text-[#0b0b0d] transition hover:bg-[#fde047]"
            >
              {c.bookingTitle} ↓
            </a>
            <p className="text-sm text-[#8f8f99]">Вече имаш час? Гледай до края — там е как да се подготвиш.</p>
          </div>

          <h2 className="mb-3 mt-10 font-mono text-[11px] uppercase tracking-[0.25em] text-[#8f8f99]">
            Какво има във видеото
          </h2>
          <VslChapters chapters={c.chapters} duration={c.duration} />
        </div>
      </section>

      {/* Числата */}
      <section className="relative border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className={`grid grid-cols-2 gap-6 ${c.stats.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            {c.stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-[clamp(30px,5vw,44px)] font-extrabold leading-none text-[#facc15]">
                  {s.value}
                </p>
                <p className="mt-2 text-sm leading-snug text-[#c9c9d1]">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-[#6b6b74]">{c.statsNote}</p>
        </div>
      </section>

      {/* Подготовка + за кого е */}
      <section className="relative mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[#facc15]/25 bg-[#facc15]/[0.04] p-6 md:p-8">
          <h2 className="font-display text-xl font-bold md:text-2xl">{c.prepTitle}</h2>
          <ol className="mt-5 space-y-3">
            {c.prep.map((p, i) => (
              <li key={p} className="flex gap-3 text-base text-white">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#facc15] text-sm font-bold text-[#0b0b0d]">
                  {i + 1}
                </span>
                <span className="pt-0.5">{p}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm leading-relaxed text-[#c9c9d1]">{c.prepNote}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="font-display text-xl font-bold md:text-2xl">За кого е</h2>
          <ul className="mt-5 space-y-2.5">
            {c.forWho.map((p) => (
              <li key={p} className="flex gap-3 text-[15px] text-[#e4e4e7]">
                <span className="text-[#4ade80]">✓</span>
                {p}
              </li>
            ))}
          </ul>
          <h3 className="mt-7 text-sm font-semibold uppercase tracking-[0.15em] text-[#8f8f99]">И за кого не е</h3>
          <ul className="mt-3 space-y-2.5">
            {c.notForWho.map((p) => (
              <li key={p} className="flex gap-3 text-[15px] text-[#a1a1aa]">
                <span className="text-[#f87171]">✕</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Календарът */}
      <section id={BOOKING_ID} className="relative mx-auto max-w-5xl scroll-mt-4 px-4 pb-16 sm:px-6">
        <div className="mb-8 text-center">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#facc15]">Разговорът е с {host}</p>
          <h2 className="font-display text-[clamp(28px,5vw,44px)] font-extrabold leading-tight">{c.bookingTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#c9c9d1]">{c.bookingLead}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111114] p-2 md:p-4">
          {toIvailo ? (
            <BookingEmbed calLink={calLink} />
          ) : (
            <BookingEmbed calLink={calLink} guests={[GEORGI_EMAIL]} />
          )}
        </div>
        <div className="mt-4 text-center">
          <a
            href={`https://cal.com/${calLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#facc15]/40 px-6 py-3 text-sm font-semibold text-[#facc15] transition hover:bg-[#facc15]/10"
          >
            Календарът не се вижда? Отвори го директно →
          </a>
        </div>
      </section>

      <footer className="relative border-t border-white/[0.06] px-4 py-8 text-center text-xs leading-relaxed text-[#6b6b74] sm:px-6">
        <p>🌐 petevai.com · promarketing.pw</p>
        <p className="mt-2">
          🤖 Видеото използва AI глас (EU AI Act, чл. 50) · Pro Marketing LTD ·{" "}
          <Link href="/privacy" className="underline hover:text-[#a1a1aa]">
            Поверителност
          </Link>
        </p>
      </footer>

      <VslStickyCta label={c.bookingTitle} target={BOOKING_ID} />
    </main>
  );
}
