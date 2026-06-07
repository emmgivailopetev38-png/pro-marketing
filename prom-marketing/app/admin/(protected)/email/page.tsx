import { EmailComposer } from "@/components/admin/EmailComposer";

export const dynamic = "force-dynamic";

export default function EmailPage() {
  const from = process.env.EMAIL_FROM ?? "—";
  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Комуникация</p>
        <h1 className="cc-title mt-2 font-display text-3xl font-bold">Изпрати имейл</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Праща от <span className="font-mono">{from}</span> · отговорите идват в твоя Gmail
        </p>
      </header>
      <EmailComposer />
    </div>
  );
}
