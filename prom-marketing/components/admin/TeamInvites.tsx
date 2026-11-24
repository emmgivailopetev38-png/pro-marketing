"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createInviteAction, revokeInviteAction, type InviteAdminResult } from "@/app/admin/(protected)/ekip/actions";
import { INVITE_ROLES, INVITE_STATE_LABEL, type InviteState } from "@/lib/team/invite-rules";
import { TEAM_ORGS, TEAM_ORG_LABEL, TEAM_ROLE_LABEL, TEAM_ROLE_SHORT, type TeamRole } from "@/lib/team/types";

export interface InviteRow {
  id: string;
  link: string;
  role: TeamRole;
  org: string;
  title: string | null;
  full_name: string | null;
  state: InviteState;
  expires_at: string;
  used_name: string | null;
}

const field =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="rounded-md border border-cyan-500/40 px-2.5 py-1 text-xs text-cyan-300"
    >
      {done ? "✓ копирано" : "📋 Копирай линка"}
    </button>
  );
}

function Send() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold disabled:opacity-60"
      style={{ background: "var(--color-accent-cyan)", color: "var(--color-bg-void)" }}
    >
      {pending ? "…" : "Направи линк-покана"}
    </button>
  );
}

/**
 * Поканите: линк за един човек, с който той сам си прави входа — паролата не
 * минава през никого. Отворените линкове стоят тук, за да се копират пак.
 */
export function TeamInvites({ invites }: { invites: InviteRow[] }) {
  const [state, action] = useActionState<InviteAdminResult | null, FormData>(createInviteAction, null);
  const open = invites.filter((i) => i.state === "open");
  const rest = invites.filter((i) => i.state !== "open").slice(0, 8);
  return (
    <section className="cc-panel p-5">
      <h2 className="font-display text-lg font-bold">Покани · линк, с който човекът сам си прави входа</h2>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
        Пращаш линка, човекът въвежда име, имейл и своя парола и влиза направо. Линкът важи 7 дни и само за един човек.
      </p>
      <ul className="mt-3 divide-y divide-white/5">
        {open.length === 0 && <li className="py-3 text-sm text-[var(--color-text-secondary)]">Няма отворени покани.</li>}
        {open.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <div className="min-w-[220px] flex-1">
              <p className="text-sm font-semibold">
                {i.full_name ?? "Без име"}{" "}
                <span className="ml-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  {TEAM_ROLE_SHORT[i.role]} · {TEAM_ORG_LABEL[i.org] ?? i.org}
                </span>
              </p>
              <p className="break-all font-mono text-[11px] text-[var(--color-text-tertiary)]">{i.link}</p>
            </div>
            <Copy text={i.link} />
            <form action={revokeInviteAction}>
              <input type="hidden" name="id" value={i.id} />
              <button type="submit" className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-[var(--color-text-tertiary)]">
                Отмени
              </button>
            </form>
          </li>
        ))}
      </ul>
      {rest.length > 0 && (
        <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
          {rest.map((i) => `${i.used_name ?? i.full_name ?? TEAM_ROLE_SHORT[i.role]} — ${INVITE_STATE_LABEL[i.state]}`).join(" · ")}
        </p>
      )}

      <form action={action} className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2">
        <label className="block text-xs text-[var(--color-text-tertiary)]">
          Име (за да знаеш чия е поканата)
          <input name="full_name" placeholder="Име Фамилия" className={field} />
        </label>
        <label className="block text-xs text-[var(--color-text-tertiary)]">
          Длъжност (както се показва)
          <input name="title" placeholder="клоузър · сетър · мениджър продажби" className={field} />
        </label>
        <label className="block text-xs text-[var(--color-text-tertiary)]">
          Ниво
          <select name="role" defaultValue="setter" className={field}>
            {INVITE_ROLES.map((r) => (
              <option key={r} value={r}>
                {TEAM_ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-[var(--color-text-tertiary)]">
          Чий човек е
          <select name="org" defaultValue="promarketing" className={field}>
            {TEAM_ORGS.map((o) => (
              <option key={o} value={o}>
                {TEAM_ORG_LABEL[o]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Send />
          {state && !state.ok && <span className="text-xs text-red-300">{state.error}</span>}
        </div>
        {state?.ok && state.link && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm sm:col-span-2">
            <p className="font-semibold text-emerald-200">Линкът за {state.name ?? "новия човек"}:</p>
            <p className="mt-1 select-all break-all font-mono text-xs">{state.link}</p>
            <div className="mt-2">
              <Copy text={state.link} />
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
