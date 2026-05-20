import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
          // 404
        </p>
        <h1 className="mt-3 font-display text-5xl font-bold">Страницата не съществува</h1>
        <Button asChild className="mt-8"><Link href="/">Обратно към началото</Link></Button>
      </div>
    </div>
  );
}
