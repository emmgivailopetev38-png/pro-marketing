import { createServiceClient } from "@/lib/supabase/service";
import { ModulePlaceholder } from "@/components/admin/ModulePlaceholder";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("demo_sessions")
    .select("id, slug, label, view_count, last_viewed_at, expires_at, enabled")
    .order("created_at", { ascending: false });

  const sessions = (data ?? []) as Array<{
    id: string;
    slug: string;
    label: string;
    view_count: number;
    last_viewed_at: string | null;
    expires_at: string | null;
    enabled: boolean;
  }>;

  const activeCount = sessions.filter((s) => s.enabled).length;
  const totalViews = sessions.reduce((s, x) => s + x.view_count, 0);

  return (
    <ModulePlaceholder
      icon="🎬"
      title="Demo режим за клиенти"
      description="Публични read-only линкове към CRM-а със синтетични данни. Изпращай на потенциални клиенти за демо без да им показваш реални контакти."
      status={
        activeCount > 0
          ? { label: `${activeCount} активни демо линкове`, tone: "ready" }
          : { label: "очаква първа demo сесия", tone: "pending" }
      }
      stats={[
        { label: "Активни линкове", value: activeCount, color: "#35c08c" },
        { label: "Прегледи (общо)", value: totalViews, color: "#d9a74a" },
        { label: "Изтекли", value: sessions.filter((s) => !s.enabled).length, color: "#e5c069" },
        { label: "Под парола", value: 0, color: "#9b8ec9", hint: "сигурни демо сесии" },
      ]}
      primaryAction={{ label: "+ Нова demo сесия", href: "/admin/demo#new" }}
      features={[
        {
          icon: "🔗",
          title: "Tokenised public URLs",
          description: "Линк формат: /demo/[slug] — slug-овете са random 12-char hex tokens, не predictable IDs.",
          ready: true,
        },
        {
          icon: "🔒",
          title: "Парола + срок на годност",
          description: "Optional bcrypt hash за защита. Auto-disable след expires_at. Browser cookie за session continuity.",
          ready: true,
        },
        {
          icon: "👁️",
          title: "Read-only views",
          description: "Всички admin страници — но без действия. Бутоните 'изпрати', 'промени' са скрити. Service role клиент бяга RLS.",
          ready: false,
        },
        {
          icon: "🎭",
          title: "Синтетични данни (Faker)",
          description: "Demo сесиите четат от синтетичен dataset — никога от продукционните contacts/bookings. Реалистични имена/имейли.",
          ready: false,
        },
        {
          icon: "📊",
          title: "View analytics",
          description: "Брой прегледи, време прекарано, кои страници са посетени. Виждаш интереса на потенциалния клиент.",
          ready: false,
        },
        {
          icon: "🎨",
          title: "Branding override",
          description: "По желание logo + цветове на клиента. Demo-то изглежда сякаш е техен CRM. Powerful at sales pitches.",
          ready: false,
        },
      ]}
    >
      {sessions.length > 0 && (
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Demo сесии
          </h2>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-3"
              >
                <span className="text-2xl">🎬</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{s.label}</p>
                  <p className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
                    /demo/{s.slug}
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                  {s.view_count} прегледа
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                    s.enabled ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300"
                  }`}
                >
                  {s.enabled ? "активна" : "спряна"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </ModulePlaceholder>
  );
}
