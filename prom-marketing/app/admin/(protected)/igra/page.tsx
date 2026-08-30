import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Кандидати от играта „ЛОСТ" — тренажорът за наемане на търговци.
 * Играта пише в същия Supabase проект (таблици с префикс sg_), затова
 * четем директно със service ролята. Горе са кандидатите (is_candidate),
 * под черта — останалите играчи.
 */

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  is_candidate: boolean | null;
  created_at: string | null;
};

type ProgressRow = {
  user_id: string;
  total_xp: number | null;
  level_idx: number | null;
  missions_completed: number | null;
  best_score: number | null;
  avg_score: number | null;
  last_played_at: string | null;
};

type PlayerRow = ProfileRow & { progress: ProgressRow | null };

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function byLastPlayed(a: PlayerRow, b: PlayerRow): number {
  const ta = a.progress?.last_played_at ? Date.parse(a.progress.last_played_at) : 0;
  const tb = b.progress?.last_played_at ? Date.parse(b.progress.last_played_at) : 0;
  return tb - ta;
}

function PlayersTable({ players, muted }: { players: PlayerRow[]; muted?: boolean }) {
  if (players.length === 0) {
    return <p className="px-4 py-6 text-sm text-[var(--color-text-tertiary)]">Още никой тук.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-default)] font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">
            <th className="px-3 py-2">Име</th>
            <th className="px-3 py-2">Имейл</th>
            <th className="px-3 py-2">Телефон</th>
            <th className="px-3 py-2">Регистрация</th>
            <th className="px-3 py-2 text-right">Мисии</th>
            <th className="px-3 py-2 text-right">Най-добър</th>
            <th className="px-3 py-2 text-right">Среден</th>
            <th className="px-3 py-2 text-right">XP</th>
            <th className="px-3 py-2 text-right">Ниво</th>
            <th className="px-3 py-2">Последно игра</th>
          </tr>
        </thead>
        <tbody className={muted ? "opacity-60" : undefined}>
          {players.map((p) => (
            <tr
              key={p.id}
              className="border-b border-[var(--color-border-default)]/50 transition-colors hover:bg-[var(--color-accent-cyan)]/5"
            >
              <td className="px-3 py-2.5">
                <Link
                  href={`/admin/igra/${p.id}`}
                  className="font-medium text-[var(--color-accent-cyan)] hover:underline"
                >
                  {p.display_name || "Без име"}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{p.email || "—"}</td>
              <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{p.phone || "—"}</td>
              <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{formatDateTime(p.created_at)}</td>
              <td className="px-3 py-2.5 text-right">{p.progress?.missions_completed ?? 0}</td>
              <td className="px-3 py-2.5 text-right font-medium">{p.progress?.best_score ?? "—"}</td>
              <td className="px-3 py-2.5 text-right">
                {p.progress?.avg_score != null ? Math.round(p.progress.avg_score) : "—"}
              </td>
              <td className="px-3 py-2.5 text-right">{p.progress?.total_xp ?? 0}</td>
              <td className="px-3 py-2.5 text-right">{p.progress?.level_idx ?? "—"}</td>
              <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">
                {formatDateTime(p.progress?.last_played_at ?? null)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function IgraPage() {
  const sb = createServiceClient();
  const [{ data: prof }, { data: prog }] = await Promise.all([
    sb
      .from("sg_profiles")
      .select("id, display_name, email, phone, is_candidate, created_at")
      .order("created_at", { ascending: false }),
    sb
      .from("sg_user_progress")
      .select("user_id, total_xp, level_idx, missions_completed, best_score, avg_score, last_played_at"),
  ]);

  const progressById = new Map(((prog ?? []) as ProgressRow[]).map((r) => [r.user_id, r]));
  const players: PlayerRow[] = ((prof ?? []) as ProfileRow[]).map((p) => ({
    ...p,
    progress: progressById.get(p.id) ?? null,
  }));

  const candidates = players.filter((p) => p.is_candidate).sort(byLastPlayed);
  const others = players.filter((p) => !p.is_candidate).sort(byLastPlayed);

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Наемане</p>
        <h1 className="cc-title mt-2 font-display text-4xl font-bold">Кандидати · Играта</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Кандидатите за търговец играят „ЛОСТ“ — тук се вижда кой докъде е стигнал и как продава.
        </p>
      </header>

      <section className="cc-panel p-5">
        <h2 className="mb-3 font-display text-base font-semibold">
          🎯 Кандидати <span className="text-sm font-normal text-[var(--color-text-tertiary)]">({candidates.length})</span>
        </h2>
        <PlayersTable players={candidates} />
      </section>

      {others.length > 0 && (
        <section className="cc-panel p-5">
          <h2 className="mb-3 font-display text-base font-semibold">
            🎮 Останали играчи{" "}
            <span className="text-sm font-normal text-[var(--color-text-tertiary)]">({others.length})</span>
          </h2>
          <PlayersTable players={others} muted />
        </section>
      )}
    </div>
  );
}
