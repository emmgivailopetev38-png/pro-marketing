"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createMemberAction,
  resetPasswordAction,
  toggleMemberAction,
  type TeamAdminResult,
} from "@/app/admin/(protected)/ekip/actions";
import { TEAM_ROLE_LABEL, TEAM_ROLES, type TeamMember } from "@/lib/team/types";

function PasswordBox({ r }: { r: TeamAdminResult | null }) {
  if (!r) return null;
  if (!r.ok) {
    return <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{r.error}</p>;
  }
  if (!r.password) return null;
  return (
    <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
      <p className="font-semibold text-emerald-200">Паролата за {r.name ?? r.email} — показва се само сега:</p>
      <p className="mt-2 select-all font-mono text-2xl tracking-wider text-[var(--color-text-primary)]">{r.password}</p>
      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
        Вход: <span className="font-mono">promarketing.pw/ekip</span> · имейл <span className="font-mono">{r.email}</span>.
        Прати му я по Viber. Ако се загуби — „Нова парола“ прави друга.
      </p>
    </div>
  );
}

function Pending({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold transition-all disabled:opacity-60"
      style={{ background: "var(--color-accent-cyan)", color: "var(--color-bg-void)" }}
    >
      {pending ? "…" : children}
    </button>
  );
}

const field =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

export function TeamManager({ members }: { members: TeamMember[] }) {
  const [created, createAction] = useActionState<TeamAdminResult | null, FormData>(createMemberAction, null);
  const [reset, resetAction] = useActionState<TeamAdminResult | null, FormData>(resetPasswordAction, null);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <section className="cc-panel p-5">
        <h2 className="font-display text-lg font-bold">Екипът · {members.length}</h2>
        <PasswordBox r={reset} />
        <ul className="mt-4 divide-y divide-white/5">
          {members.length === 0 && (
            <li className="py-6 text-center text-sm text-[var(--color-text-secondary)]">Още никой. Добави първия отдясно.</li>
          )}
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <div className="min-w-[200px] flex-1">
                <p className="font-semibold">
                  {m.full_name}{" "}
                  <span className="ml-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    {TEAM_ROLE_LABEL[m.role] ?? m.role}
                  </span>
                  {!m.active && <span className="ml-2 text-xs text-red-300">спрян</span>}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  <span className="font-mono">{m.email}</span>
                  {m.phone ? ` · ${m.phone}` : ""}
                  {m.last_login_at
                    ? ` · последен вход ${new Date(m.last_login_at).toLocaleString("bg-BG", { timeZone: "Europe/Sofia", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                    : " · още не е влизал"}
                </p>
                {m.notes && <p className="mt-1 whitespace-pre-line text-xs text-[var(--color-text-secondary)]">{m.notes}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <form action={toggleMemberAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="field" value="notify_new_leads" />
                  <input type="hidden" name="value" value={m.notify_new_leads ? "0" : "1"} />
                  <button
                    type="submit"
                    className={`rounded-md border px-2.5 py-1 text-xs ${m.notify_new_leads ? "border-cyan-500/40 text-cyan-300" : "border-white/10 text-[var(--color-text-tertiary)]"}`}
                  >
                    {m.notify_new_leads ? "✉️ Получава новите лийдове" : "✉️ Без известия"}
                  </button>
                </form>
                <form action={resetAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="email" value={m.email} />
                  <input type="hidden" name="name" value={m.full_name} />
                  <button type="submit" className="rounded-md border border-amber-500/40 px-2.5 py-1 text-xs text-amber-300">
                    🔑 Нова парола
                  </button>
                </form>
                <form action={toggleMemberAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="field" value="active" />
                  <input type="hidden" name="value" value={m.active ? "0" : "1"} />
                  <button
                    type="submit"
                    className={`rounded-md border px-2.5 py-1 text-xs ${m.active ? "border-white/10 text-[var(--color-text-tertiary)]" : "border-emerald-500/40 text-emerald-300"}`}
                  >
                    {m.active ? "⏸ Спри достъпа" : "▶ Пусни достъпа"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="cc-panel p-5">
        <h2 className="font-display text-lg font-bold">Нов човек</h2>
        <form action={createAction} className="mt-3 space-y-3">
          <label className="block text-xs text-[var(--color-text-tertiary)]">
            Име
            <input name="full_name" required placeholder="Димитър" className={field} />
          </label>
          <label className="block text-xs text-[var(--color-text-tertiary)]">
            Имейл (с него влиза)
            <input name="email" type="email" required placeholder="ime@gmail.com" className={field} />
          </label>
          <label className="block text-xs text-[var(--color-text-tertiary)]">
            Телефон
            <input name="phone" placeholder="0888 …" className={field} />
          </label>
          <label className="block text-xs text-[var(--color-text-tertiary)]">
            Роля
            <select name="role" defaultValue="setter" className={field}>
              {TEAM_ROLES.filter((r) => r !== "owner").map((r) => (
                <option key={r} value={r}>
                  {TEAM_ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-[var(--color-text-tertiary)]">
            Уговорката (комисиона, срок, кога започва)
            <textarea name="notes" rows={3} className={field} />
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input type="checkbox" name="notify_new_leads" value="1" defaultChecked /> Получава писмо при всеки нов лийд
          </label>
          <Pending>Създай и покажи паролата</Pending>
        </form>
        <PasswordBox r={created} />
      </section>
    </div>
  );
}
