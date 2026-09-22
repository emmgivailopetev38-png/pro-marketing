"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { portalSendLinkAction, portalToggleAction, setContactOwnerAction } from "@/app/admin/(protected)/clients/[id]/team-actions";
import { TaskBoard, type AssigneeOption } from "@/components/ekip/TaskBoard";
import { MessagesPanel } from "@/components/ekip/MessagesPanel";
import type { TaskBoard as Board } from "@/lib/team/tasks-rules";
import type { MessageLite, ThreadSummary } from "@/lib/team/messages-rules";

/**
 * Екипът и клиентът в картона: кой го води, порталът му, задачите по него и
 * нишката със съобщения (с отметка „клиентът го вижда“).
 */

function Btn({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "go" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${tone === "go" ? "border-[var(--color-accent-cyan)]/50 text-[var(--color-accent-cyan)]" : "border-white/10 text-[var(--color-text-secondary)]"}`}
    >
      {pending ? "…" : children}
    </button>
  );
}

export function ContactTeamPanel({
  contactId,
  ownerId,
  members,
  portal,
  board,
  thread,
  me,
  templates,
}: {
  contactId: string;
  ownerId: string | null;
  members: AssigneeOption[];
  portal: { enabled: boolean; token: string | null; views: number; lastSeen: string | null; hasEmail: boolean };
  board: Board;
  thread: { messages: MessageLite[]; title: string; summary: ThreadSummary };
  me: string;
  templates: Array<{ id: string; label: string; text: string }>;
}) {
  const [toggle, toggleAct] = useActionState(portalToggleAction, null);
  const [send, sendAct] = useActionState(portalSendLinkAction, null);
  const site = typeof window !== "undefined" ? window.location.origin : "https://promarketing.pw";
  const link = portal.token && portal.enabled ? `${site}/klient/${portal.token}` : null;

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="cc-panel p-5">
          <h3 className="mb-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">Кой го води</h3>
          <form action={setContactOwnerAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="contact_id" value={contactId} />
            <select name="owner_id" defaultValue={ownerId ?? ""} className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none">
              <option value="">Ивайло</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <input name="reason" placeholder="с какво влиза (по желание)" className="min-w-[200px] flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none" />
            <Btn tone="go">Дай му го</Btn>
          </form>
          <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
            Продавачът вижда картона в /ekip/prodazhbi, записва разговорите с името си и при „Спечелен“ комисионната се начислява сама.
          </p>
        </section>

        <section className="cc-panel p-5">
          <h3 className="mb-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">Порталът на клиента</h3>
          {link ? (
            <div className="space-y-2 text-sm">
              <p className="break-all font-mono text-xs text-[var(--color-accent-cyan)]">{link}</p>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                Отварян {portal.views} пъти{portal.lastSeen ? ` · последно ${new Date(portal.lastSeen).toLocaleString("bg-BG", { timeZone: "Europe/Sofia", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={link} target="_blank" className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
                  Отвори като клиента ↗
                </Link>
                <form action={sendAct}>
                  <input type="hidden" name="contact_id" value={contactId} />
                  <Btn tone="go">{portal.hasEmail ? "✉️ Изпрати линка на клиента" : "✉️ Няма имейл в картона"}</Btn>
                </form>
                <form action={toggleAct}>
                  <input type="hidden" name="contact_id" value={contactId} />
                  <input type="hidden" name="enable" value="0" />
                  <Btn>Спри портала</Btn>
                </form>
              </div>
              {send && <p className={`text-xs ${send.ok ? "text-emerald-300" : "text-red-300"}`}>{send.message ?? send.error}</p>}
            </div>
          ) : (
            <form action={toggleAct} className="space-y-2">
              <input type="hidden" name="contact_id" value={contactId} />
              <input type="hidden" name="enable" value="1" />
              <p className="text-xs text-[var(--color-text-secondary)]">
                Личен линк, без парола: клиентът вижда напредъка, отмята стъпките, които са при него, пише ни и иска разговор. Всичко влиза тук, в картона.
              </p>
              <Btn tone="go">Включи портала и направи линк</Btn>
            </form>
          )}
          {toggle && <p className={`mt-2 break-all text-xs ${toggle.ok ? "text-emerald-300" : "text-red-300"}`}>{toggle.message ?? toggle.error}</p>}
        </section>
      </div>

      <section className="cc-panel p-5">
        <h3 className="mb-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">Задачи по този клиент</h3>
        <TaskBoard board={board} isOwner assignees={members} showAssignee threadBase="/admin/saobshtenia" contactId={contactId} compact />
      </section>

      <section className="cc-panel p-5">
        <h3 className="mb-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">Съобщения по клиента · екип и портал</h3>
        <MessagesPanel threads={[thread.summary]} current={thread.summary.key} messages={thread.messages} title={thread.title} me={me} base="/admin/saobshtenia" templates={templates} contactId={contactId} />
      </section>
    </div>
  );
}
