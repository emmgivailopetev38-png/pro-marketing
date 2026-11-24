"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { acceptInviteAction, type InviteResult } from "@/app/ekip/pokana/actions";
import { PASSWORD_MIN } from "@/lib/team/invite-rules";

const FIELD =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]/60 focus:border-[var(--color-accent-cyan)]/60";
const LABEL = "block text-xs text-[var(--color-text-tertiary)]";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-base font-bold transition-all disabled:opacity-60"
      style={{ background: "var(--color-accent-cyan)", color: "var(--color-bg-void)" }}
    >
      {pending ? "Създавам входа…" : "Създай моя вход"}
    </button>
  );
}

/** Формата на поканата: паролата се избира тук и никой друг не я вижда. */
export function InviteForm({ token, name, askMeet }: { token: string; name: string; askMeet: boolean }) {
  const [state, action] = useActionState<InviteResult | null, FormData>(acceptInviteAction, null);
  return (
    <form action={action} className="mt-5 space-y-3">
      <input type="hidden" name="token" value={token} />
      <label className={LABEL}>
        Име и фамилия
        <input name="full_name" required defaultValue={name} autoComplete="name" className={FIELD} />
      </label>
      <label className={LABEL}>
        Имейл (с него влизаш; на него идват поканите за срещи)
        <input name="email" type="email" required inputMode="email" autoComplete="username" placeholder="ime@gmail.com" className={FIELD} />
      </label>
      <label className={LABEL}>
        Телефон
        <input name="phone" inputMode="tel" autoComplete="tel" placeholder="0888 …" className={FIELD} />
      </label>
      {askMeet && (
        <label className={LABEL}>
          Твоят постоянен Google Meet линк (ти си домакин на срещите си) — може и по-късно
          <input name="meet_url" inputMode="url" placeholder="https://meet.google.com/…" className={FIELD} />
        </label>
      )}
      <label className={LABEL}>
        Парола (поне {PASSWORD_MIN} знака, с буква и цифра)
        <input name="password" type="password" required minLength={PASSWORD_MIN} autoComplete="new-password" className={FIELD} />
      </label>
      <label className={LABEL}>
        Паролата още веднъж
        <input name="password2" type="password" required minLength={PASSWORD_MIN} autoComplete="new-password" className={FIELD} />
      </label>
      {state && !state.ok && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{state.error}</p>
      )}
      <Submit />
      <p className="text-center text-[11px] leading-snug text-[var(--color-text-tertiary)]">
        Данните за клиенти в системата са на ProMarketing — ползват се само за работата по тях.
      </p>
    </form>
  );
}
