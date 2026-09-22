"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PortalProject } from "@/lib/portal/rules";
import { visibleTasks } from "@/lib/portal/rules";
import type { MessageLite } from "@/lib/team/messages-rules";

/**
 * Живата част на портала: стъпките с бутон „Готово от моя страна“, съобщенията
 * и трите бързи действия. Всичко минава през /api/klient/<token>.
 */

type Tab = "steps" | "chat" | "updates";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("bg-BG", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });
}

export function PortalApp({
  token,
  projects,
  updates,
  messages,
  contactName,
}: {
  token: string;
  projects: PortalProject[];
  updates: Array<{ id: string; title: string; body: string | null; at: string; by: string | null }>;
  messages: MessageLite[];
  contactName: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(messages.length > 0 ? "chat" : "steps");
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"message" | "request" | "call">("message");

  async function call(action: string, payload: Record<string, unknown>) {
    setBusy(action + (payload.task_id ?? ""));
    setStatus(null);
    try {
      const res = await fetch(`/api/klient/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...payload }) });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok || !j.ok) {
        setStatus({ ok: false, text: j.error ?? "Нещо не мина. Опитайте пак след малко." });
        return false;
      }
      setStatus({ ok: true, text: j.message ?? "Готово." });
      router.refresh();
      return true;
    } catch {
      setStatus({ ok: false, text: "Няма връзка. Опитайте пак." });
      return false;
    } finally {
      setBusy(null);
    }
  }

  const steps = projects.flatMap((p) => visibleTasks(p.tasks).map((t) => ({ ...t, project: p.title })));
  const waiting = steps.filter((t) => t.client_visible && t.status !== "done" && !t.client_done_at);
  const rest = steps.filter((t) => !waiting.includes(t));

  return (
    <section className="kl-card" style={{ marginTop: 14 }}>
      <div className="kl-tabs">
        <button type="button" className={`kl-tab ${tab === "steps" ? "on" : ""}`} onClick={() => setTab("steps")}>
          Стъпки {waiting.length > 0 ? `· ${waiting.length} чакат Вас` : ""}
        </button>
        <button type="button" className={`kl-tab ${tab === "chat" ? "on" : ""}`} onClick={() => setTab("chat")}>
          Пишете ни {messages.length > 0 ? `· ${messages.length}` : ""}
        </button>
        <button type="button" className={`kl-tab ${tab === "updates" ? "on" : ""}`} onClick={() => setTab("updates")}>
          Какво свършихме {updates.length > 0 ? `· ${updates.length}` : ""}
        </button>
      </div>

      {tab === "steps" && (
        <div>
          {steps.length === 0 && <p className="kl-muted" style={{ marginTop: 12 }}>Още няма стъпки, които да зависят от Вас.</p>}
          {waiting.length > 0 && (
            <>
              <h2 style={{ marginTop: 14 }}>Чакат Вас</h2>
              <ul className="kl-list">
                {waiting.map((t) => (
                  <li key={t.id} className="kl-item wait">
                    <div className="t">
                      <b>{t.title}</b>
                      <small>
                        {t.project}
                        {t.due_date ? ` · до ${new Date(`${t.due_date}T12:00:00Z`).toLocaleDateString("bg-BG", { day: "numeric", month: "long" })}` : ""}
                      </small>
                    </div>
                    <button type="button" className="kl-b ok sm" disabled={busy === `approve${t.id}`} onClick={() => call("approve", { task_id: t.id })}>
                      {busy === `approve${t.id}` ? "…" : "✓ Готово от моя страна"}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {rest.length > 0 && (
            <>
              <h2 style={{ marginTop: 16 }}>Останалите стъпки</h2>
              <ul className="kl-list">
                {rest.map((t) => (
                  <li key={t.id} className={`kl-item ${t.status === "done" ? "ok" : ""}`}>
                    <div className="t">
                      <b>
                        {t.status === "done" ? "✅ " : t.kind === "client_request" ? "📩 " : "⏳ "}
                        {t.title}
                      </b>
                      <small>
                        {t.project}
                        {t.client_done_at ? " · отметнахте я" : ""}
                        {t.status === "done" ? " · готова" : t.kind === "client_request" ? " · Ваша заявка, работим по нея" : ""}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          {status && <p className={`kl-status ${status.ok ? "ok" : "err"}`}>{status.text}</p>}
        </div>
      )}

      {tab === "chat" && (
        <div>
          <div className="kl-msgs">
            {messages.length === 0 && <p className="kl-muted">Още нищо. Пишете ни — четем всеки ден.</p>}
            {messages.map((m) => (
              <div key={m.id} className={`kl-msg ${m.from_client ? "me" : ""}`}>
                <small>
                  {m.from_client ? contactName : `${m.author_name} · Pro Marketing`} · {fmt(m.created_at)}
                </small>
                {m.body}
              </div>
            ))}
          </div>
          <div className="kl-tabs" style={{ marginTop: 14 }}>
            <button type="button" className={`kl-tab ${mode === "message" ? "on" : ""}`} onClick={() => setMode("message")}>
              💬 Съобщение
            </button>
            <button type="button" className={`kl-tab ${mode === "request" ? "on" : ""}`} onClick={() => setMode("request")}>
              📩 Искам нещо ново
            </button>
            <button type="button" className={`kl-tab ${mode === "call" ? "on" : ""}`} onClick={() => setMode("call")}>
              📞 Искам разговор
            </button>
          </div>
          <textarea
            className="kl-ta"
            style={{ marginTop: 10 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === "message"
                ? "Напишете ни каквото и да е — въпрос, бележка, промяна."
                : mode === "request"
                  ? "Какво Ви трябва? Ще стане задача и ще Ви кажем кога е готова."
                  : "За какво искате да се чуем? Ще Ви позвъним на следващия работен ден до 10:00 или по-рано."
            }
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="kl-b go"
              disabled={busy !== null || (mode !== "call" && !text.trim())}
              onClick={async () => {
                const ok = await call(mode, { text });
                if (ok) setText("");
              }}
            >
              {busy === mode ? "…" : mode === "message" ? "Изпрати" : mode === "request" ? "Изпрати заявката" : "Поискай разговор"}
            </button>
            {status && <span className={`kl-status ${status.ok ? "ok" : "err"}`}>{status.text}</span>}
          </div>
        </div>
      )}

      {tab === "updates" && (
        <div>
          {updates.length === 0 && <p className="kl-muted" style={{ marginTop: 12 }}>Още няма отбелязани обновления. Ще се появяват тук при всяка готова стъпка.</p>}
          {updates.map((u) => (
            <div key={u.id} className="kl-upd">
              <b>{u.title}</b>
              {u.body && <span style={{ whiteSpace: "pre-wrap" }}>{u.body}</span>}
              <small>
                {u.by ?? "Pro Marketing"} · {fmt(u.at)}
              </small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
