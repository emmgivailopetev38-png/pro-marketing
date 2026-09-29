import Link from "next/link";
import { listMembers } from "@/lib/team/repository";
import { openTaskCounts } from "@/lib/team/tasks";
import { TeamManager } from "@/components/admin/TeamManager";
import { TEAM_MODULE_HREF, TEAM_MODULE_LABEL } from "@/lib/team/types";
import { navFor } from "@/lib/team/roles";
import { rotationPool } from "@/lib/team/routing-rules";

export const dynamic = "force-dynamic";

export default async function EkipAdminPage() {
  const [members, taskCounts] = await Promise.all([listMembers(), openTaskCounts()]);
  // Кръгът за новите лийдове: всеки активен със „Звънене“, по реда на влизане.
  const pool = rotationPool(members);
  const inPool = new Set(pool.map((m) => m.id));
  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Екип</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Хората с личен вход</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Всеки влиза през <span className="font-mono">/ekip</span> с имейл и своя парола и вижда само своите модули —
            по ролята, поправена от отметките в профила му. Всичко, което записва, стои в картона с неговото име.
          </p>
          {pool.length > 0 && (
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              🎯 Новите лийдове от рекламите и сайта се редуват: <b>{pool.map((m) => m.full_name).join(" → ")}</b>
              {pool.length > 1 ? ` → отначало (по ${Math.round(100 / pool.length)}% на човек).` : " (сам — получава всички)."}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/zadachi" className="cc-btn">✅ Задачи по хора</Link>
            <Link href="/admin/saobshtenia" className="cc-btn">💬 Съобщения</Link>
            <Link href="/admin/konversii" className="cc-btn">📈 Конверсии и екип</Link>
            <Link href="/admin/komisioni" className="cc-btn">🏆 Комисионни</Link>
            <Link href="/admin/materiali" className="cc-btn">📚 Материали</Link>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          {members
            .filter((m) => m.active)
            .map((m) => {
              const t = taskCounts.get(m.id) ?? { open: 0, overdue: 0 };
              return (
                <div key={m.id} className="cc-panel p-4">
                  <p className="font-semibold">{m.full_name}</p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">
                    {m.title ?? ""} · {t.open} отворени задачи{t.overdue ? ` · ${t.overdue} просрочени` : ""}
                  </p>
                  {inPool.has(m.id) && (
                    <p className="mt-1 text-[11px] text-amber-300">
                      🎯 в кръга за нови лийдове ·{" "}
                      <Link href={`/ekip?as=${m.id}`} className="underline">
                        👀 виж опашката
                      </Link>
                    </p>
                  )}
                  <p className="mt-2 flex flex-wrap gap-1">
                    {navFor(m).map((n) => (
                      <Link key={n.module} href={TEAM_MODULE_HREF[n.module]} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]">
                        {TEAM_MODULE_LABEL[n.module]}
                      </Link>
                    ))}
                  </p>
                </div>
              );
            })}
        </section>

        <TeamManager members={members} />
      </div>
    </div>
  );
}
