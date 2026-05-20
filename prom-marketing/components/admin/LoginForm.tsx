"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = createClient();

  const onMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success("Линк за вход е изпратен на имейла ти");
  };

  const onGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/admin` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="w-full max-w-sm space-y-5">
      <h1 className="font-display text-3xl font-bold">Вход</h1>
      {initialError === "forbidden" && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Този имейл няма достъп до администраторския панел.
        </div>
      )}
      <form onSubmit={onMagic} className="space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@promarketing.bg"
          className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]"
        />
        <Button type="submit" disabled={sending} className="w-full">
          {sending ? "Изпращане..." : "Изпрати magic link"}
        </Button>
      </form>
      <div className="relative my-4 text-center text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
        или
      </div>
      <Button type="button" variant="outline" onClick={onGoogle} className="w-full">
        Влез с Google
      </Button>
    </div>
  );
}
