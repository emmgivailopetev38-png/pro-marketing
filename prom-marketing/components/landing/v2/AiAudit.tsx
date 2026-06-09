"use client";
import { useState } from "react";
import {
  BedDouble, UtensilsCrossed, ShoppingBag, Building, Wrench, Sparkles,
  HelpCircle, Phone, ArrowRight, ArrowLeft, Check, Loader2, Zap,
  type LucideIcon,
} from "lucide-react";
import { track } from "@/lib/analytics/track";

type Module = { title: string; desc: string };
type Industry = {
  id: string;
  label: string;
  icon: LucideIcon;
  roi: string;
  modules: Module[];
};

const INDUSTRIES: Industry[] = [
  {
    id: "hotel", label: "Хотел / Къща за гости", icon: BedDouble,
    roi: "+34% уловени запитвания · –8ч/седмица ръчна работа",
    modules: [
      { title: "AI рецепционист 24/7", desc: "Отговаря на запитвания и резервации денонощно — на български, на твоя тон." },
      { title: "Авто-потвърждения и follow-up", desc: "Потвърждава, напомня и иска отзив след престоя — без теб." },
      { title: "Личен CRM", desc: "Всеки гост, всяко запитване и приход — на едно табло." },
    ],
  },
  {
    id: "food", label: "Ресторант / Кафе / Бар", icon: UtensilsCrossed,
    roi: "+27% резервации · 0 пропуснати обаждания",
    modules: [
      { title: "AI за резервации и поръчки", desc: "Поема обажданията и чата, записва маси и поръчки автоматично." },
      { title: "Авто-промоции", desc: "Връща клиенти с персонални оферти в точния момент." },
      { title: "Управление на отзиви", desc: "Събира 5-звездни ревюта автоматично след посещение." },
    ],
  },
  {
    id: "shop", label: "Магазин / Е-commerce", icon: ShoppingBag,
    roi: "+22% конверсия · –10ч/седмица",
    modules: [
      { title: "AI чат-продавач 24/7", desc: "Съветва, продава и затваря поръчки, докато спиш." },
      { title: "Връщане на изоставени колички", desc: "Авто-съобщения, които спасяват изгубени продажби." },
      { title: "Авто-оферти и фактури", desc: "Генерира оферти и документи за секунди." },
    ],
  },
  {
    id: "realestate", label: "Имоти / Брокери", icon: Building,
    roi: "+40% горещи лийда · моментален отговор",
    modules: [
      { title: "AI квалификация на лийдове", desc: "Отсява сериозните купувачи/наематели от любопитните." },
      { title: "Авто-насрочване на огледи", desc: "Записва огледи директно в календара ти." },
      { title: "Follow-up последователности", desc: "Не изпуска нито един потенциален клиент." },
    ],
  },
  {
    id: "services", label: "Услуги / Сервиз", icon: Wrench,
    roi: "–60% неявявания · 0 изпуснати обаждания",
    modules: [
      { title: "AI записване на часове", desc: "Поема обажданията и записва клиенти 24/7." },
      { title: "Умни напомняния", desc: "SMS/имейл напомняния, които спират no-show." },
      { title: "Авто-оферти по поръчка", desc: "Бързи персонални оферти за всяка заявка." },
    ],
  },
  {
    id: "beauty", label: "Здраве / Красота", icon: Sparkles,
    roi: "+30% запълнен график · реактивиране на клиенти",
    modules: [
      { title: "AI запис 24/7", desc: "Клиентите си запазват час сами, по всяко време." },
      { title: "Напомняния и реактивиране", desc: "Връща стари клиенти автоматично." },
      { title: "Личен CRM с история", desc: "Всеки клиент и процедура — подредени." },
    ],
  },
];

const GENERIC: Industry = {
  id: "other", label: "Друго / Не съм сигурен", icon: HelpCircle,
  roi: "–70% рутина · повече време за растеж",
  modules: [
    { title: "AI агент за обаждания и чат", desc: "Поема рутинната комуникация 24/7." },
    { title: "Личен AI CRM", desc: "Всички лийдове, клиенти и приходи на едно място." },
    { title: "Софтуер по поръчка", desc: "Точно това, което твоят бизнес иска — нищо излишно." },
  ],
};

export function AiAudit() {
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const pick = (ind: Industry) => {
    setIndustry(ind);
    track("ai_audit_industry", { industry: ind.id });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 6) return;
    setStatus("submitting");
    track("ai_audit_submit", { industry: industry?.id });
    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name || undefined,
          phone,
          company_activity: industry?.label,
          message: `AI аудит от сайта · ${industry?.label} · ${industry?.roi}`,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("done");
        track("ai_audit_lead", { industry: industry?.id });
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="av-audit relative w-full max-w-md rounded-2xl border border-white/10 bg-[rgba(8,12,24,0.72)] p-5 backdrop-blur-xl md:p-6">
      <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-60" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 60px -20px rgba(34,211,238,0.5)" }} />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)]"><Zap className="h-3.5 w-3.5" /></span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent-cyan)]">AI аудит · 30 секунди</span>
        </div>

        {status === "done" ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-cyan)]/12">
              <Check className="h-7 w-7 text-[var(--color-accent-cyan)]" />
            </div>
            <h3 className="font-display text-xl font-bold">Готово! Обаждаме се днес.</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Подготвяме персоналния ти AI план за <b className="text-[var(--color-text-primary)]">{industry?.label}</b> и ти звъним в рамките на работния ден.
            </p>
          </div>
        ) : !industry ? (
          <>
            <h3 className="mt-3 font-display text-lg font-semibold leading-snug">
              Виж за 30 сек. какво AI може да автоматизира в твоя бизнес.
            </h3>
            <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">Избери дейност:</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[...INDUSTRIES, GENERIC].map((ind) => {
                const Icon = ind.icon;
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => pick(ind)}
                    className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-[13px] font-medium text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-accent-cyan)]/50 hover:bg-[var(--color-accent-cyan)]/[0.06] hover:text-[var(--color-text-primary)]"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[var(--color-accent-cyan)]" />
                    <span className="leading-tight">{ind.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setIndustry(null)} className="mt-3 inline-flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-cyan)]">
              <ArrowLeft className="h-3 w-3" /> смени дейност
            </button>
            <h3 className="mt-2 font-display text-lg font-semibold">
              Твоят AI план за <span className="text-[var(--color-accent-cyan)]">{industry.label}</span>
            </h3>

            <div className="mt-3 space-y-2">
              {industry.modules.map((m, i) => (
                <div
                  key={m.title}
                  className="av-reveal flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-cyan)]/15 font-mono text-[10px] text-[var(--color-accent-cyan)]">{i + 1}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{m.title}</p>
                    <p className="text-[12px] leading-snug text-[var(--color-text-tertiary)]">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="av-reveal mt-3 rounded-xl border border-[var(--color-accent-cyan)]/25 bg-[var(--color-accent-cyan)]/[0.06] px-3 py-2.5" style={{ animationDelay: "300ms" }}>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent-cyan)]">Очакван ефект</p>
              <p className="mt-0.5 text-[13px] font-semibold text-[var(--color-text-primary)]">{industry.roi}</p>
            </div>

            {status === "error" && (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">Грешка — опитай пак или звънни на +359 877 399 963.</p>
            )}

            <form onSubmit={submit} className="mt-4 space-y-2.5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Име (по желание)"
                autoComplete="name"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-accent-cyan)]/60 placeholder:text-[var(--color-text-tertiary)]/60"
              />
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 transition focus-within:border-[var(--color-accent-cyan)]/60">
                <Phone className="h-4 w-4 shrink-0 text-[var(--color-accent-cyan)]" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="Телефон за обаждане"
                  className="w-full bg-transparent py-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]/60"
                />
              </div>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent-cyan)] px-6 py-3.5 text-[15px] font-bold text-[var(--color-bg-void)] shadow-[0_0_40px_-8px_rgba(34,211,238,0.6)] transition-all hover:shadow-[0_0_55px_-6px_rgba(34,211,238,0.8)] disabled:opacity-60"
              >
                {status === "submitting" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Изпращам…</>
                ) : (
                  <>Изпрати ми пълния план <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                )}
              </button>
              <p className="text-center text-[10px] text-[var(--color-text-tertiary)]">Безплатно · без ангажимент · отговор в работния ден</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
