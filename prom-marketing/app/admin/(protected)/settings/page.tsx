export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.bg"}/api/webhooks/cal`;
  const secret = process.env.CAL_WEBHOOK_SECRET ?? "";
  const masked = secret ? `${secret.slice(0, 4)}…${secret.slice(-4)}` : "не е настроен";
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const username = process.env.NEXT_PUBLIC_CAL_USERNAME ?? "";
  const slug = process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? "";

  return (
    <div className="space-y-8 p-6 md:p-10">
      <header>
        <h1 className="font-display text-3xl font-bold">Настройки</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Само за преглед — промени се правят чрез env vars и redeploy</p>
      </header>

      <section className="glass space-y-3 rounded-xl p-6">
        <h2 className="font-display text-xl font-bold">Cal.com</h2>
        <Row label="Потребител" value={username || "не е настроен"} />
        <Row label="Event slug" value={slug || "не е настроен"} />
        <Row label="Webhook URL" value={webhookUrl} mono />
        <Row label="Webhook secret" value={masked} mono />
      </section>

      <section className="glass space-y-3 rounded-xl p-6">
        <h2 className="font-display text-xl font-bold">Администратори</h2>
        {allowed.length === 0 && <p className="text-sm text-[var(--color-text-tertiary)]">Няма зададени имейли</p>}
        <ul className="space-y-1 text-sm">
          {allowed.map((e) => <li key={e} className="font-mono">{e}</li>)}
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--color-border-default)] py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-[var(--color-text-tertiary)]">{label}</span>
      <span className={mono ? "font-mono text-sm break-all" : "text-sm"}>{value}</span>
    </div>
  );
}
