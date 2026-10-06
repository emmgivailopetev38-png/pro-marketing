"use client";
import { useActionState } from "react";
import { giveKinoListAction, type GiveResult } from "@/app/admin/(protected)/kino/actions";

/** „Дай на Димитър“ — целият списък отива в опашката му в /ekip с един клик на Ивайло. */
export function GiveListButton({ list, ids, label }: { list: "dayBefore" | "warm"; ids: string[]; label: string }) {
  const [state, action, pending] = useActionState<GiveResult | null, FormData>(giveKinoListAction, null);
  return (
    <form action={action} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
      <input type="hidden" name="list" value={list} />
      {ids.map((id) => (
        <input key={id} type="hidden" name="contact_id" value={id} />
      ))}
      <button type="submit" className="cc-btn cc-btn-primary" disabled={pending || ids.length === 0}>
        {pending ? "Давам…" : label}
      </button>
      {state && (
        <span style={{ fontSize: 13, color: state.ok ? "#86efac" : "#fca5a5" }} role="status">
          {state.message}
        </span>
      )}
    </form>
  );
}
