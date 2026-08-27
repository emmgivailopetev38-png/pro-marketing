import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ShieldCheck, Link2Off } from "lucide-react";
import "@/app/admin/(protected)/admin.css";
import { SkriptTrainer } from "@/components/admin/skript/SkriptTrainer";
import { ShareGate } from "@/components/share/ShareGate";
import { fetchCallReviews, type CallReview } from "@/lib/skript/reviews";
import { SHARE_COOKIE, safeEqual, unlockCookieValue, verifyShareToken } from "@/lib/share/link";

/* =====================================================================
   Разделът „Разговорът" за човек отвън — по таен линк.

   Страницата седи ИЗВЪН /admin: няма layout на CRM-а, няма меню към
   него и няма как оттук да се стигне до клиенти, оферти или пари.
   Гостът вижда само материала — да чете, не да пише: формата „След
   срещата" изобщо не се рендерира, а „Напредък" излиза само ако
   линкът изрично го носи.
   ===================================================================== */

export const metadata: Metadata = {
  title: "Разговорът · споделено",
  robots: { index: false, follow: false, nocache: true },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="cc-bg min-h-screen overflow-x-clip">
      <div className="cc-content px-4 py-6 md:px-10 md:py-9">{children}</div>
    </div>
  );
}

function Invalid() {
  return (
    <Shell>
      <div className="mx-auto mt-16 max-w-lg text-center">
        <Link2Off className="mx-auto size-10 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
        <h1 className="mt-5 text-2xl font-bold text-[var(--color-text-primary)]">
          Линкът вече не отваря нищо
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          Или срокът му е изтекъл, или адресът е непълен. Поискай нов от Ивайло —
          <a className="ml-1 text-[var(--color-accent-cyan)]" href="mailto:ivailo@promarketing.pw">
            ivailo@promarketing.pw
          </a>
          .
        </p>
      </div>
    </Shell>
  );
}

export default async function SharedRazgovoratPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: rawToken } = await params;
  const token = decodeURIComponent(rawToken);
  const payload = verifyShareToken(token);

  if (!payload || payload.s !== "skript") return <Invalid />;

  // Втора врата: код за достъп, ако линкът е издаден с такъв.
  if (payload.p) {
    const cookieStore = await cookies();
    const seen = cookieStore.get(SHARE_COOKIE)?.value ?? "";
    if (!safeEqual(seen, unlockCookieValue(token))) {
      return (
        <Shell>
          <ShareGate token={token} name={payload.n} />
        </Shell>
      );
    }
  }

  const showProgress = (payload.x ?? []).includes("napredak");
  let reviews: CallReview[] = [];
  if (showProgress) {
    try {
      reviews = await fetchCallReviews();
    } catch {
      reviews = [];
    }
  }

  return (
    <Shell>
      <SkriptTrainer reviews={reviews} shared guestName={payload.n} showProgress={showProgress} />
      <p className="mt-10 flex items-center justify-center gap-2 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
        <ShieldCheck className="size-3.5" /> Личен линк за {payload.n} · ProMarketing
      </p>
    </Shell>
  );
}
