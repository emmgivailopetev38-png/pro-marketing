"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function LeadsActions() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const syncNow = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/leads/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Грешка при синхронизация");
      } else {
        const added: number = data?.sync?.totalNewLeads ?? 0;
        toast.success(
          added > 0
            ? `Добавени ${added} нови лийда`
            : "Синхронизирано — без нови лийдове"
        );
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Грешка");
    } finally {
      setBusy(false);
    }
  };

  const sendTestEmail = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/leads/test-email", { method: "POST" });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? "Грешка");
      else toast.success("Тестов имейл изпратен");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Грешка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={syncNow} disabled={busy}>
        {busy ? "Синхронизация…" : "Синхронизирай сега"}
      </Button>
      <Button variant="outline" onClick={sendTestEmail} disabled={busy}>
        Тестов имейл
      </Button>
    </div>
  );
}
