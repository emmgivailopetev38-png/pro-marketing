"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/landing/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Преглед" },
  { href: "/admin/bookings", label: "Срещи" },
  { href: "/admin/settings", label: "Настройки" },
];

export function AdminShell({ children, email }: { children: React.ReactNode; email: string }) {
  const path = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen">
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
