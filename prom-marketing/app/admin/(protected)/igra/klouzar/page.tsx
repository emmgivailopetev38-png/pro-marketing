import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { setKlouzarStatusAction } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Подборът на клоузър в три стъпки (igra.promarketing.pw/klouzar):
 * 1 кандидатура → 2 задача (запис на разговор + самооценка) → 3 групово
 * предизвикателство на живо. Тук Ивайло слуша записите и мести хората напред.
 */

type Row = {
  id: string;
  token: string;
  created_at: string;
  status: string;
  name: string;
  phone: string;
  email: string;
  city: string | null;
  answers: { k: string; q: string; a: string }[] | null;
  source: Record<string, string> | null;
  task_path: string | null;
  task_link: string | null;
  task_reflection: string | null;
  task_at: string | null;
  admin_note: string | null;
};

const STATUS: Record<string, { label: string; tone: string }> = {
  zadacha: { label: "2 · предал задачата — слушай", tone: "var(--color-accent-amber, #fbbf24)" },
  kandidat: { label: "1 · кандидатствал, задачата чака", tone: "var(--color-text-tertiary)" },
  grupa: { label: "3 · поканен на груповото", tone: "var(--color-accent-cyan)" },
  nayet: { label: "✓ нает", tone: "var(--color-accent-green, #34d399)" },
  otkaz: { label: "✕ отказ", tone: "var(--color-accent-red, #f43f5e)" },
};
const ORDER = ["zadacha", "kandidat", "grupa", "nayet", "otkaz"];

function when(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Sofia",
  });
}

export default async function KlouzarAdminPage() {
  const sb = createServiceClient();
  const { data } = await sb.from("sg_klouzar").select("*").order("created_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  // Подписани адреси за записите — валидни час, колкото да се изслушат от страницата.
  const audio = new Map<string, string>();
  await Promise.all(
    rows
      .filter((r) => r.task_path)
      .map(async (r) => {
        const { data: s } = await sb.storage.from("klouzar").createSignedUrl(r.task_path!, 3600);
        if (s?.signedUrl) audio.set(r.id, s.signedUrl);
      }),
  );

  const sorted = [...rows].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const count = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Наемане</p>
        <h1 className="cc-title mt-2 font-display text-4xl font-bold">Клоузър · 3 стъпки</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Кандидатура → задача (запис на разговор) → групово предизвикателство.{" "}
          <a href="https://igra.promarketing.pw/klouzar" className="text-[var(--color-accent-cyan)] hover:underline">
            Страницата
          </a>{" "}
          · <Link href="/admin/igra" className="text-[var(--color-accent-cyan)] hover:underline">кандидатите от играта</Link>
        </p>
        <p className="mt-3 text-sm">
          Слушай: <strong>{count("zadacha")}</strong> · чакат задачата: {count("kandidat")} · на груповото:{" "}
          {count("grupa")} · наети: {count("nayet")}
        </p>
      </header>

      {sorted.length === 0 && (
        <p className="cc-panel p-6 text-sm text-[var(--color-text-tertiary)]">Още няма кандидати.</p>
      )}

      {sorted.map((r) => {
        const st = STATUS[r.status] ?? { label: r.status, tone: "inherit" };
        const src = Object.entries(r.source ?? {})
          .map(([k, v]) => `${k}=${v}`)
          .join(" · ");
        return (
          <section key={r.id} className="cc-panel space-y-3 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">
                {r.name} <span className="text-sm font-normal text-[var(--color-text-tertiary)]">· {r.city || "—"}</span>
              </h2>
              <span className="font-mono text-xs" style={{ color: st.tone }}>
                {st.label}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="text-[var(--color-accent-cyan)]">
                {r.phone}
              </a>{" "}
              · {r.email} · кандидатства {when(r.created_at)}
              {r.task_at ? ` · задача ${when(r.task_at)}` : ""}
              {src ? ` · ${src}` : ""}
            </p>

            {(audio.get(r.id) || r.task_link || r.task_reflection) && (
              <div className="space-y-2 rounded-lg border border-[var(--color-border-default)] p-3">
                {audio.get(r.id) && (
                  <audio src={audio.get(r.id)} controls preload="none" className="w-full max-w-lg" />
                )}
                {r.task_link && (
                  <p className="text-sm">
                    Линк:{" "}
                    <a href={r.task_link} target="_blank" rel="noreferrer" className="text-[var(--color-accent-cyan)] hover:underline">
                      {r.task_link}
                    </a>
                  </p>
                )}
                {r.task_reflection && (
                  <p className="text-sm">
                    <span className="text-[var(--color-text-tertiary)]">Какво би направил по-добре: </span>
                    <em>{r.task_reflection}</em>
                  </p>
                )}
              </div>
            )}

            <details>
              <summary className="cursor-pointer text-sm text-[var(--color-text-secondary)]">
                Отговорите от кандидатурата ({(r.answers ?? []).length})
              </summary>
              <dl className="mt-2 space-y-2 text-sm">
                {(r.answers ?? []).map((a) => (
                  <div key={a.k}>
                    <dt className="text-[var(--color-text-tertiary)]">{a.q}</dt>
                    <dd>{a.a}</dd>
                  </div>
                ))}
              </dl>
            </details>

            <form action={setKlouzarStatusAction} className="flex flex-wrap items-center gap-2 pt-1">
              <input type="hidden" name="id" value={r.id} />
              <select
                name="status"
                defaultValue={r.status}
                className="rounded-md border border-[var(--color-border-default)] bg-transparent px-2 py-1.5 text-sm"
              >
                <option value="kandidat">1 · кандидат</option>
                <option value="zadacha">2 · предал задачата</option>
                <option value="grupa">3 · покана за груповото</option>
                <option value="nayet">✓ нает</option>
                <option value="otkaz">✕ отказ</option>
              </select>
              <input
                name="note"
                defaultValue={r.admin_note ?? ""}
                placeholder="Бележка (как звучи, кога е груповото…)"
                className="min-w-[240px] flex-1 rounded-md border border-[var(--color-border-default)] bg-transparent px-2 py-1.5 text-sm"
              />
              <button type="submit" className="rounded-md border border-[var(--color-accent-cyan)] px-3 py-1.5 text-sm text-[var(--color-accent-cyan)]">
                Запиши
              </button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
