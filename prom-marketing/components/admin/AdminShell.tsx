"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/landing/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Преглед" },
  { href: "/admin/bookings", label: "Срещи" },
  { href: "/admin/leads", label: "Meta лийдове" },
  { href: "/admin/settings", label: "Настройки" },
];

export function AdminShell({ children, email }: { children: React.ReactNode; email: string }) {
  const path = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="min-h-screen">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/80 px-4 py-3 backdrop-blur">
        <Link href="/admin" onClick={() => setOpen(false)}>
          <Logo />
        </Link>
        <button
          type="button"
          aria-label="Отвори меню"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-text-primary)] transition-colors hover:bg-white/5"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-2 border-r border-[var(--color-border-default)] bg-[var(--color-bg-deep)] p-6 transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Админ навигация"
      >
        <div className="flex items-center justify-between">
          <Link href="/admin" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <button
            type="button"
            aria-label="Затвори меню"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-text-primary)] transition-colors hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                path === l.href
                  ? "bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)]"
                  : "text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)]"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <p className="mb-2 text-xs text-[var(--color-text-tertiary)]">{email}</p>
          <Button variant="ghost" onClick={signOut} className="w-full justify-start">
            Изход
          </Button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-2 border-r border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/60 p-6 md:flex">
        <Link href="/admin"><Logo /></Link>
        <nav className="mt-8 flex flex-col gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                path === l.href
                  ? "bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)]"
                  : "text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)]"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <p className="mb-2 text-xs text-[var(--color-text-tertiary)]">{email}</p>
          <Button variant="ghost" onClick={signOut} className="w-full justify-start">
            Изход
          </Button>
        </div>
      </aside>
      <main className="md:pl-64">{children}</main>
    </div>
  );
}
