import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { canSee, homeFor } from "@/lib/team/roles";
import { materialsFor } from "@/lib/team/materials";
import { CLIENT_LINKS, SYSTEM_GUIDE, VIDEO_OTZIVI_IDVAT } from "@/lib/team/klient-materiali";
import { OTZIVI, redSChisla } from "@/lib/site/otzivi";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { MaterialsList } from "@/components/ekip/MaterialsList";
import { ClientLinks } from "@/components/ekip/ClientLinks";
import { VideoFeedback } from "@/components/ekip/VideoFeedback";
import { obuchenieVideoUrl } from "@/lib/team/obuchenie-video";

export const dynamic = "force-dynamic";

/**
 * „Материали“ — как работи системата, какво се праща на клиента преди срещата
 * (видеата, уебинарът, портфолиото), отзивите на доволните клиенти, предложения
 * за нови видеа и обучението по роля (PDF за телефона, HTML за екрана).
 */
export default async function MaterialiPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "materiali")) redirect(homeFor(actor.member));

  const [nav, videoUrl] = await Promise.all([ekipNav(actor), obuchenieVideoUrl()]);
  const role = actor.kind === "owner" ? "owner" : actor.member.role;
  const member = actor.kind === "owner" ? { role: "owner" as const, permissions: null } : actor.member;
  const { mine, other } = materialsFor(role, (m) => canSee(member, m));
  const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="materiali" unread={nav.unread} />
      <main className="space-y-6 px-4 py-4">
        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🧭 Как работи системата · за 5 минути</h2>
          {videoUrl && (
            <div className="mt-3">
              <video controls preload="metadata" playsInline src={videoUrl} className="aspect-video w-full rounded-xl border border-white/10 bg-black" />
              <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">
                🎬 Цялата система за 4 минути — кое къде е и какво се натиска. 🤖 Гласът е генериран с AI, екраните са истински.
              </p>
            </div>
          )}
          <div className="mt-2 space-y-2">
            {SYSTEM_GUIDE.map((s) => (
              <details key={s.title} className="rounded-xl border border-white/10 px-3 py-2">
                <summary className="cursor-pointer text-sm font-semibold">{s.title}</summary>
                <dl className="mt-2 space-y-1.5 text-sm">
                  {s.items.map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-semibold">{k}</dt>
                      <dd className="text-[var(--color-text-secondary)]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-violet-400/30 bg-violet-500/[0.06] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🎓 Академията — какво точно продаваш</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Всички курсове от програмата са отключени за теб. Регистрирай се в{" "}
            <a href="https://akademia.promarketing.pw" target="_blank" rel="noreferrer" className="font-semibold text-violet-200 underline">
              akademia.promarketing.pw
            </a>{" "}
            със същия имейл, с който влизаш тук — курсовете се отварят сами. Изгледай поне „Започни оттук“ и основите, за да говориш с клиента от първо лице.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🎬 Какво пращаш на клиента</h2>
          <p className="mt-1 mb-3 text-xs text-[var(--color-text-secondary)]">
            Видеата преди срещата са тези, които Георги праща досега: човек, който е гледал видеото, идва подготвен и по-често идва изобщо.
          </p>
          <ClientLinks links={CLIENT_LINKS} />
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">⭐ Отзиви на доволни клиенти</h2>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Истински съобщения от клиенти (снимки, без имена — така стоят и на сайта). Можеш да ги пратиш като снимка или с линка към „Успехи и отзиви“. {redSChisla()}.
          </p>
          <ul className="mt-3 space-y-3">
            {OTZIVI.map((o) => (
              <li key={o.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <a href={o.snimka.src} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.snimka.src} alt={o.text} width={o.snimka.width} height={o.snimka.height} className="h-auto w-full rounded-lg border border-white/10" loading="lazy" />
                </a>
                <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
                  {o.etiket} · {o.kanal} · {o.data}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/5 p-3 text-xs text-[var(--color-text-secondary)]">
            <p className="font-semibold text-amber-200">🎥 Идват видео отзиви</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {VIDEO_OTZIVI_IDVAT.map((v) => (
                <li key={v.etiket}>
                  {v.etiket} — {v.status}
                </li>
              ))}
            </ul>
            <p className="mt-1">Качват се тук, щом клиентът одобри версията. Дотогава не се пращат.</p>
          </div>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">💡 Предложи корекция или ново видео</h2>
          <p className="mt-1 mb-3 text-xs text-[var(--color-text-secondary)]">
            Изгледай видеата преди срещата. Ако нещо трябва да се промени или липсва видео, което би помогнало на клиентите, напиши го тук. Отива направо при Ивайло.
          </p>
          <VideoFeedback videos={CLIENT_LINKS.map((l) => l.title.replace(/^\S+\s/, ""))} />
        </section>

        <MaterialsList title="📚 Обучение за теб" items={mine} />
        {other.length > 0 && <MaterialsList title="📖 За останалите роли — ако ти е любопитно как работят другите" items={other} muted />}
      </main>
    </div>
  );
}
