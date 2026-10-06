import type { CSSProperties } from "react";
import Link from "next/link";
import { KINO } from "@/lib/kino/config";
import { kinoTimeline, phaseAt, premiereLabels, sofiaDayLabel, sofiaTimeLabel, chapterIndexAt, formatClock } from "@/lib/kino/time";
import { formatEur } from "@/lib/kino/pricing";
import { REACTIONS, totalMinutes, type KinoListId } from "@/lib/kino/analytics";
import { loadKinoDashboard, type KinoPerson } from "@/lib/kino/admin-data";
import { kinoStages, kinoFlowEnabled } from "@/lib/kino/flow";
import { smsStatus } from "@/lib/kino/sms";
import { serverNow } from "@/lib/kino/server";
import { RetentionChart, ChapterBars, ReactionStrips } from "@/components/kino/admin/KinoCharts";
import { GiveListButton } from "@/components/kino/admin/GiveListButton";

export const dynamic = "force-dynamic";

/* =====================================================================
   /admin/kino — „ВЪЛНАТА“ отвътре: кой взе билет, кой дойде, докъде
   гледа (по минути и по глави), какво реагира, какво пита, кой натисна,
   кой плати — и трите списъка за Димитър (най-горе: натиснали „купи“ без
   плащане) с бутон „Дай на Димитър“. „Твоето число“ е първата колона.
   ===================================================================== */

const PHASE_LABEL: Record<string, string> = {
  before: "Преди премиерата",
  doors: "Вратите са отворени",
  film: "Филмът върви",
  live: "Живата част",
  replay: "Повторение",
  closed: "Свален",
};

function Kpi({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="cc-kpi p-4" style={{ "--kpi": color } as CSSProperties}>
      <p className="hud">{label}</p>
      <p className="cc-kpi-value mt-2 font-mono text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{sub}</p>}
    </div>
  );
}

function pct(a: number, b: number): string {
  return b ? `${Math.round((a / b) * 100)} %` : "—";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  return `${sofiaDayLabel(ms).split(", ")[1]} · ${sofiaTimeLabel(ms)}`;
}

function PeopleTable({ people, mode }: { people: KinoPerson[]; mode: KinoListId }) {
  if (people.length === 0) return <p className="px-1 py-4 text-sm text-[var(--color-text-tertiary)]">Още никой тук.</p>;
  const third = mode === "abandoned" ? "Натисна" : mode === "dayBefore" ? "Роля" : "Изгледа";
  const fourth =
    mode === "abandoned" ? "Заявка · какво му яде времето" : mode === "dayBefore" ? "Какво му яде времето · 3-те въпроса" : "Стигна до";
  const fifth = mode === "abandoned" ? "Изгледа" : mode === "dayBefore" ? "Билет от" : "Натисна · пита";
  return (
    <div className="overflow-x-auto">
      <table className="cc-table" style={{ minWidth: 920 }}>
        <thead>
          <tr>
            <th title="„Твоето число“ — часове седмично в повтаряща се работа (сцена 9.7)">Число</th>
            <th>Човек</th>
            <th>Телефон</th>
            <th>{third}</th>
            <th>{fourth}</th>
            <th>{fifth}</th>
            <th>Даден</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id}>
              <td className="cc-num" style={{ fontWeight: 700, fontSize: 15 }}>
                {p.hours != null ? `${p.hours} ч` : "—"}
              </td>
              <td>
                <Link href={`/admin/clients/${p.id}`} className="font-medium text-[var(--color-accent-cyan)] hover:underline">
                  {p.name}
                </Link>
                {p.email && <div className="text-xs text-[var(--color-text-tertiary)]">{p.email}</div>}
              </td>
              <td className="cc-num">{p.phone ? <a href={`tel:${p.phone}`}>{p.phone}</a> : "—"}</td>
              <td>
                {mode === "abandoned"
                  ? `${p.wants === "deposit" ? "Капаро" : "Влизам в потока"} · ${fmtDate(p.abandonedAt)}`
                  : mode === "dayBefore"
                    ? p.roleLabel
                    : p.ratio != null
                      ? `${Math.round(p.ratio * 100)} %`
                      : "—"}
              </td>
              <td style={{ maxWidth: 360 }}>
                <span className="text-[var(--color-text-secondary)]">
                  {mode === "warm"
                    ? `${p.lastChapter ? `„${p.lastChapter}“` : "—"}${p.maxPos != null ? ` · ${formatClock(p.maxPos)}` : ""}`
                    : [p.application, p.pain ? `„${p.pain}“` : null, mode === "dayBefore" ? p.warmup : null].filter(Boolean).join(" · ") || "—"}
                </span>
              </td>
              <td className="text-[var(--color-text-secondary)]">
                {mode === "abandoned"
                  ? p.ratio != null
                    ? `${Math.round(p.ratio * 100)} %`
                    : "—"
                  : mode === "dayBefore"
                    ? fmtDate(p.registeredAt)
                    : [p.clicks.join(", "), p.questions ? `${p.questions} въпр.` : null].filter(Boolean).join(" · ") || "—"}
              </td>
              <td>{p.given ? "✓" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function KinoAdminPage() {
  const d = await loadKinoDashboard();
  const tl = kinoTimeline();
  const now = serverNow();
  const phase = phaseAt(now, tl);
  const when = premiereLabels();
  const sms = smsStatus();
  const flowOn = kinoFlowEnabled();
  const stages = kinoStages();
  const k = d.kpi;
  const minutes = totalMinutes();
  const minuteLabels = Array.from({ length: minutes }, (_, m) => {
    const c = KINO.film.chapters[chapterIndexAt(m * 60, KINO.film.chapters)];
    return m * 60 >= KINO.film.offerAtSec ? `минута ${m + 1} · надписите` : `минута ${m + 1} · „${c.title}“`;
  });
  const chapterStarts = KINO.film.chapters.map((c) => ({ minute: Math.floor(c.startSec / 60), label: c.title }));
  const chips: Array<[string, boolean]> = [
    [`Напомняния: ${flowOn ? "включени" : "изключени (KINO_FLOW_ENABLED)"}`, flowOn],
    [`SMS: ${sms.enabled ? "включени" : `изключени — ${sms.reason}`}`, sms.enabled],
    [`Stripe: ${process.env.STRIPE_SECRET_KEY ? "ключът е сложен" : "няма STRIPE_SECRET_KEY"}`, Boolean(process.env.STRIPE_SECRET_KEY)],
    [`Проследяване: ${d.trackingReady ? "работи" : "миграцията не е приложена"}`, d.trackingReady],
    [`Видео: ${KINO.video.kind === "none" ? "няма (сухо)" : KINO.video.kind}`, KINO.video.kind !== "none"],
    [`Viber клуб: ${KINO.viberClubUrl ? "има линк" : "няма линк"}`, Boolean(KINO.viberClubUrl)],
  ];

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Онлайн кино</p>
        <h1 className="cc-title mt-2 font-display text-4xl font-bold">{KINO.title} · залата</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Премиера {when.day}, {when.time} · повторение до {when.replayUntilDay}, {when.replayUntilTime} · сега: {PHASE_LABEL[phase]}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map(([t, ok]) => (
            <span key={t} className="cc-chip" style={{ borderColor: ok ? "rgba(34,197,94,0.45)" : "rgba(250,204,21,0.45)" }}>
              {ok ? "✓" : "⚠"} {t}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link className="cc-btn" href="/kino" target="_blank">
            Афишът ↗
          </Link>
          {["lobby", "doors", "film", "offer", "bonus", "live", "replay", "closed"].map((s) => (
            <Link key={s} className="cc-btn" href={`/kino/zala?sim=${s}`} target="_blank">
              Залата · {s}
            </Link>
          ))}
        </div>
        {d.error && <p className="mt-3 text-sm text-amber-300">{d.error}</p>}
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Kpi label="Записани" value={k.registered} sub={`${k.decisionMakers} собственици/управители`} color="#06b6d4" />
        <Kpi label="Дойдоха на живо" value={k.cameLive} sub={`${pct(k.cameLive, k.registered)} от записаните`} color="#a78bfa" />
        <Kpi label="На повторение" value={k.cameReplay} sub="поне веднъж" color="#818cf8" />
        <Kpi label="Изгледаха ≥ 50 %" value={k.watched50} sub={`${pct(k.watched50, k.cameLive + k.cameReplay)} от влезлите`} color="#22d3ee" />
        <Kpi label="До надписите" value={k.reachedEnd} sub={`${k.bonus} отключиха бонуса`} color="#ec4899" />
        <Kpi label="Натиснаха бутон" value={k.clickers} sub={`${k.questions} въпроса`} color="#f472b6" />
        <Kpi label="Разговори" value={k.bookings} sub="записани от залата" color="#facc15" />
        <Kpi label="Капара" value={k.deposits} sub={formatEur(k.depositsEur)} color="#fb923c" />
        <Kpi label="Влязоха в потока" value={k.buyers} sub={`сделки ${formatEur(k.dealsEur)}`} color="#34d399" />
        <Kpi label="Събрано" value={formatEur(k.collectedEur)} sub="плащания + капара" color="#10b981" />
      </section>

      <section className="cc-panel p-5">
        <h2 className="mb-1 font-display text-base font-semibold">Задържане по минути</h2>
        <p className="mb-3 text-xs text-[var(--color-text-tertiary)]">
          Колко души са гледали всяка минута (по пулсовете на 15 s). Процентът е от влезлите.
        </p>
        <RetentionChart
          data={d.retention}
          entered={k.entered}
          chapterStarts={chapterStarts}
          offerAtMin={Math.floor(KINO.film.offerAtSec / 60)}
          minuteLabels={minuteLabels}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="cc-panel min-w-0 p-5">
          <h2 className="mb-3 font-display text-base font-semibold">Задържане по глави</h2>
          <ChapterBars rows={d.chapters} />
        </section>
        <section className="cc-panel min-w-0 p-5">
          <h2 className="mb-1 font-display text-base font-semibold">Реакции по минути</h2>
          <p className="mb-3 text-xs text-[var(--color-text-tertiary)]">По една лента за всяка реакция, една и съща ос по минути.</p>
          <ReactionStrips rows={d.reactions} minutes={minutes} emojis={REACTIONS} />
        </section>
      </div>

      <section className="cc-panel p-5">
        <h2 className="mb-1 font-display text-base font-semibold">
          ❓ Въпроси от залата <span className="text-sm font-normal text-[var(--color-text-tertiary)]">({d.questions.length})</span>
        </h2>
        <p className="mb-3 text-xs text-[var(--color-text-tertiary)]">За живата част — най-новите горе. Всеки е и в картона на човека.</p>
        {d.questions.length === 0 ? (
          <p className="text-sm text-[var(--color-text-tertiary)]">Още няма въпроси.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="cc-table" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th>Кога</th>
                  <th>Кой</th>
                  <th>Минута</th>
                  <th>Въпросът</th>
                </tr>
              </thead>
              <tbody>
                {d.questions.map((q) => (
                  <tr key={q.id}>
                    <td className="cc-num">{fmtDate(q.at)}</td>
                    <td>
                      <Link href={`/admin/clients/${q.contactId}`} className="text-[var(--color-accent-cyan)] hover:underline">
                        {q.name}
                      </Link>
                    </td>
                    <td className="cc-num">{q.minute ?? "—"}</td>
                    <td style={{ whiteSpace: "pre-wrap" }}>{q.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="cc-panel p-5" style={{ borderColor: d.abandoned.length ? "rgba(251, 146, 60, 0.55)" : undefined }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">
              🛒 За Димитър · натиснаха „купи“ и не платиха{" "}
              <span className="text-sm font-normal text-[var(--color-text-tertiary)]">({d.abandoned.length})</span>
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Бутон 1 („Влизам в потока“) или 2 (капарото), а 15 минути по-късно — без плащане. Най-новите са горе; при всеки нов идва
              имейл и Telegram. Излизат оттук, щом платят.
            </p>
          </div>
          <GiveListButton list="abandoned" ids={d.abandoned.filter((p) => !p.given).map((p) => p.id)} label="Дай на Димитър" />
        </div>
        <PeopleTable people={d.abandoned} mode="abandoned" />
      </section>

      <section className="cc-panel p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">
              📞 За Димитър · ден −1 <span className="text-sm font-normal text-[var(--color-text-tertiary)]">({d.dayBefore.length})</span>
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Собственици и управители с билет, без капаро/плащане. „Запазили сме ти място — какво искаш да научиш?“ Първо — с
              „Твоето число“ (по-голямото горе).
            </p>
          </div>
          <GiveListButton list="dayBefore" ids={d.dayBefore.filter((p) => !p.given).map((p) => p.id)} label="Дай на Димитър" />
        </div>
        <PeopleTable people={d.dayBefore} mode="dayBefore" />
      </section>

      <section className="cc-panel p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">
              🔥 За Димитър · гледали ≥ 50 % без покупка <span className="text-sm font-normal text-[var(--color-text-tertiary)]">({d.warm.length})</span>
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Обаждане до 1–2 часа след филма; записва разговор с два конкретни часа, до 72 часа. Първо — с „Твоето число“
              (по-голямото горе), после най-гледалите.
            </p>
          </div>
          <GiveListButton list="warm" ids={d.warm.filter((p) => !p.given).map((p) => p.id)} label="Дай на Димитър" />
        </div>
        <PeopleTable people={d.warm} mode="warm" />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="cc-panel min-w-0 p-5 xl:col-span-2">
          <h2 className="mb-3 font-display text-base font-semibold">💳 Плащания и капара</h2>
          {d.money.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)]">Още няма.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="cc-table" style={{ minWidth: 560 }}>
                <thead>
                  <tr>
                    <th>Кога</th>
                    <th>Кой</th>
                    <th>Какво</th>
                    <th style={{ textAlign: "right" }}>Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {d.money.map((m) => (
                    <tr key={m.id}>
                      <td className="cc-num">{fmtDate(m.at)}</td>
                      <td>
                        <Link href={`/admin/clients/${m.contactId}`} className="text-[var(--color-accent-cyan)] hover:underline">
                          {m.name}
                        </Link>
                      </td>
                      <td>{m.title}</td>
                      <td className="cc-num" style={{ textAlign: "right" }}>
                        {formatEur(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="cc-panel min-w-0 p-5">
          <h2 className="mb-3 font-display text-base font-semibold">👆 Кликове по бутон</h2>
          {d.clicksByButton.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)]">Още няма.</p>
          ) : (
            <table className="cc-table">
              <tbody>
                {d.clicksByButton.map((c) => (
                  <tr key={c.button}>
                    <td>{c.button}</td>
                    <td className="cc-num" style={{ textAlign: "right" }}>
                      {c.people} души
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h2 className="mb-3 mt-6 font-display text-base font-semibold">🎯 Билети по източник</h2>
          {d.sources.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)]">Още няма.</p>
          ) : (
            <table className="cc-table">
              <tbody>
                {d.sources.map((s) => (
                  <tr key={s.source}>
                    <td>{s.source}</td>
                    <td className="cc-num" style={{ textAlign: "right" }}>
                      {s.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="cc-panel p-5">
        <h2 className="mb-1 font-display text-base font-semibold">🗓️ Загряването</h2>
        <p className="mb-3 text-xs text-[var(--color-text-tertiary)]">
          Имейлите и SMS-ите тръгват сами от крона (на 15 мин), щом KINO_FLOW_ENABLED=1. Viber клубът и обажданията са ръчни.
        </p>
        <div className="overflow-x-auto">
          <table className="cc-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Кога</th>
                <th>Какво</th>
                <th>Канал</th>
                <th>До кого</th>
                <th style={{ textAlign: "right" }}>Пратени</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((s) => (
                <tr key={s.id}>
                  <td className="cc-num">{fmtDate(new Date(s.opensMs).toISOString())}</td>
                  <td>{s.label}</td>
                  <td>{s.channels.map((c) => (c === "email" ? "имейл" : sms.enabled ? "SMS" : "SMS (изкл.)")).join(" + ")}</td>
                  <td className="text-[var(--color-text-secondary)]">
                    {s.audience === "all" ? "всички записани" : s.audience === "notEntered" ? "невлезлите" : "без купилите"}
                  </td>
                  <td className="cc-num" style={{ textAlign: "right" }}>
                    {s.channels.map((c) => d.sent[`${s.id}:${c}`] ?? 0).join(" / ")}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="cc-num">ден −10 … −1</td>
                <td>Viber „Кино клуб“: кадри, трейлъри, анкета „Кое те притеснява в AI?“</td>
                <td>Viber (ръчно)</td>
                <td className="text-[var(--color-text-secondary)]">членовете на клуба</td>
                <td className="cc-num" style={{ textAlign: "right" }}>
                  —
                </td>
              </tr>
              <tr>
                <td className="cc-num">ден −1 · след филма</td>
                <td>Обажданията на Димитър (двата списъка горе)</td>
                <td>телефон</td>
                <td className="text-[var(--color-text-secondary)]">собственици · гледали ≥ 50 %</td>
                <td className="cc-num" style={{ textAlign: "right" }}>
                  —
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
