"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function LeadSourcesForm() {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [formId, setFormId] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) {
      toast.error("Попълни име и URL");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/leads/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, csv_url: url, form_id: formId || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Грешка");
      } else {
        toast.success("Източник добавен");
        setLabel("");
        setUrl("");
        setFormId("");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Грешка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={add} className="space-y-3">
      <h3 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
        Добави нов източник
      </h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr_1fr_auto]">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Име (напр. сайт лийдове 12.05)"
          className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent-cyan)]"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Google Sheet URL"
          className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent-cyan)]"
        />
        <input
          value={formId}
          onChange={(e) => setFormId(e.target.value)}
          placeholder="Form ID (опц.)"
          className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent-cyan)]"
        />
        <Button type="submit" disabled={busy}>
          {busy ? "…" : "Добави"}
        </Button>
      </div>
      <p className="text-xs text-[var(--color-text-tertiary)]">
        {`Sheet-а трябва да е споделен като „Anyone with the link can view". Системата чете чрез публичния CSV export endpoint.`}
      </p>
    </form>
  );
}
