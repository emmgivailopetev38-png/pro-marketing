"use client";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  void error;
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
          // нещо се обърка
        </p>
        <h1 className="mt-3 font-display text-5xl font-bold">Възникна грешка</h1>
        <p className="mt-4 max-w-md text-[var(--color-text-secondary)]">
          Опитай отново. Ако проблемът остане, пиши ни на hello@promarketing.bg.
        </p>
        <Button className="mt-8" onClick={reset}>Опитай отново</Button>
      </div>
    </div>
  );
}
