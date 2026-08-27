"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { unlockShare } from "@/app/razgovorat/[token]/actions";

/** Кодът за достъп пред споделения раздел. */
export function ShareGate({ token, name }: { token: string; name: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await unlockShare(token, code);
      if (res.ok) {
        router.refresh();
      } else {
        setError("Кодът не съвпада. Провери го в съобщението от Ивайло.");
      }
    });
  }

  return (
    <div className="mx-auto mt-16 max-w-md">
      <div className="cc-panel p-7">
        <KeyRound className="size-8 text-[var(--color-accent-cyan)]" strokeWidth={1.5} />
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">
          Здравей, {name}
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--color-text-secondary)]">
          Този линк отваря един раздел — „Разговорът". Въведи кода за достъп и си вътре.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Код за достъп"
            autoFocus
            autoComplete="one-time-code"
            className="w-full rounded-lg px-3.5 py-2.5 text-[15px]"
          />
          <button
            type="submit"
            disabled={pending || !code.trim()}
            className="cc-btn cc-btn-primary w-full justify-center disabled:opacity-50"
          >
            {pending ? "Проверявам…" : "Отвори"}
          </button>
          {error && <p className="text-[13px] text-[#fda4af]">{error}</p>}
        </form>
      </div>
    </div>
  );
}
