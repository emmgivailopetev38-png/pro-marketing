import { MEETING_MSG_ICON, MEETING_MSG_KINDS, MEETING_MSG_LABEL, meetingMessage, type MeetingMsgKind } from "@/lib/team/sreshta-saobshtenia";
import type { MeetingMsgRow } from "@/lib/team/sreshti";
import { fmtSofia } from "@/lib/team/time";
import { MessageBox } from "./MessageBox";

/**
 * „Съобщения за срещите“ на /ekip: за всяка предстояща среща — кое съобщение е
 * на ред (потвърждение с линка · напомняне ден преди · напомняне малко преди),
 * готово за копиране и пращане по Viber. Пратеното се отбелязва и не излиза пак.
 */
export function MeetingMessages({ rows, setterName }: { rows: MeetingMsgRow[]; setterName: string }) {
  if (rows.length === 0) return null;
  const due = rows.filter((r) => r.due);
  const rest = rows.filter((r) => !r.due);
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-fuchsia-300">
        💜 Съобщения за срещите · {due.length} за пращане
      </h2>
      <p className="-mt-1 text-xs text-[var(--color-text-tertiary)]">
        Потвърждение с линка веднага след записването, напомняне ден преди и малко преди часа. Копирай → отвори Viber →
        прати → „Изпратих“, за да не излиза пак. Текстът може да се редактира преди копиране.
      </p>
      {due.map((r) => (
        <Row key={r.bookingId} r={r} kind={r.due as MeetingMsgKind} setterName={setterName} open />
      ))}
      {rest.length > 0 && (
        <details className="rounded-2xl border border-white/10 p-3">
          <summary className="cursor-pointer text-xs text-[var(--color-text-secondary)]">
            Другите предстоящи срещи · {rest.length} (нищо за пращане в момента; отвори, ако искаш да пратиш пак)
          </summary>
          <div className="mt-3 space-y-3">
            {rest.map((r) => (
              <Row key={r.bookingId} r={r} kind={null} setterName={setterName} open={false} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

function Row({ r, kind, setterName, open }: { r: MeetingMsgRow; kind: MeetingMsgKind | null; setterName: string; open: boolean }) {
  const input = { name: r.name, whenIso: r.whenIso, meetingUrl: r.meetingUrl, setterName };
  const kinds: MeetingMsgKind[] = kind ? [kind] : MEETING_MSG_KINDS.filter((k) => k !== "noshow");
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-[var(--color-text-primary)]">{r.name}</h3>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
            {r.meetingUrl ? "🔗 с линк за срещата" : "📞 без линк · по телефона"}
            {r.bookedBy ? ` · записа ${r.bookedBy}` : " · през сайта / Ивайло"}
            {r.sent.length > 0 ? ` · пратени: ${r.sent.map((k) => MEETING_MSG_ICON[k]).join(" ")}` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-400/40 px-2 py-0.5 text-[11px] text-emerald-200">
          📅 {fmtSofia(r.whenIso)}
        </span>
      </div>
      <a href={`tel:${r.phone}`} className="mt-2 inline-block text-sm font-semibold text-[var(--color-accent-cyan)]">
        📞 {r.phone}
      </a>
      {open ? (
        kinds.map((k) => (
          <MessageBox
            key={k}
            title={`${MEETING_MSG_ICON[k]} ${MEETING_MSG_LABEL[k]}`}
            formal={meetingMessage(k, { ...input, formal: true })}
            informal={meetingMessage(k, { ...input, formal: false })}
            phone={r.phone}
            bookingId={r.bookingId}
            contactId={null}
            kind={k}
          />
        ))
      ) : (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-fuchsia-200/80">Прати пак някое от съобщенията</summary>
          {kinds.map((k) => (
            <MessageBox
              key={k}
              title={`${MEETING_MSG_ICON[k]} ${MEETING_MSG_LABEL[k]}`}
              formal={meetingMessage(k, { ...input, formal: true })}
              informal={meetingMessage(k, { ...input, formal: false })}
              phone={r.phone}
              bookingId={r.bookingId}
              contactId={null}
              kind={k}
            />
          ))}
        </details>
      )}
    </article>
  );
}
