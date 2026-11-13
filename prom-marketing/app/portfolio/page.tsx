/* /portfolio — „Работата ни, без имена“ (13.11.2026, Ивайло: „от нашите системи,
   без да показваш хората, и нашите видеа от клиентите, пробни видеа, всякакви
   видеа — качи портфолио на доволни клиенти на уебсайта“).
   Данните: lib/site/portfolio.ts. Клиповете: public/portfolio/ (съкратени, без звук,
   без имена/телефони/сайтове на клиентите, с AI етикет в кадъра). */

import "../v2/v2-design.css";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { NavbarV2 } from "@/components/landing/v2/NavbarV2";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { VideoKarta } from "@/components/uspehi/VideoKarta";
import { BRANSHOVE, KAM_DATA, SISTEMI, VIDEA } from "@/lib/site/portfolio";
import { VIDEA as SISTEMA_V_DEISTVIE } from "@/lib/site/uspehi";

const FooterV2 = dynamic(() => import("@/components/landing/v2/FooterV2").then((m) => ({ default: m.FooterV2 })));

export const metadata: Metadata = {
  title: "Портфолио — видеа, реклами и AI системи за клиенти",
  description: `${VIDEA.length} видеа и реклами за фирми от ${BRANSHOVE.length} бранша, пробни видеа преди първата среща и ${SISTEMI.length} системи — CRM, AI агенти, отчети. Без имена и лични данни.`,
  alternates: { canonical: "/portfolio" },
  openGraph: {
    title: "Портфолио · ProMarketing",
    description: "Видеа, реклами и AI системи, които направихме за клиенти — без имена, само резултатът.",
    images: [{ url: "/portfolio/og.jpg", width: 1200, height: 630 }],
  },
};

export default function PortfolioPage() {
  const chisla = [
    { stoinost: String(VIDEA.length), tekst: "видеа и реклами на тази страница" },
    { stoinost: String(BRANSHOVE.length), tekst: "бранша — от строителство до парфюми" },
    { stoinost: String(SISTEMI.length), tekst: "системи — CRM, AI агенти, отчети" },
    { stoinost: "0", tekst: "лични данни — имена на хора, телефони, лица" },
  ];
  const vDeistvie = SISTEMA_V_DEISTVIE.filter((v) => ["eli-zvani", "komanden-centar", "palen-otchet"].includes(v.slug));

  return (
    <div data-v2 className="v2-scope" style={{ background: "var(--v2-void)", minHeight: "100vh" }}>
      <NavbarV2 />
      <main data-v2 style={{ paddingTop: 90 }}>
        <section className="v2-section" style={{ paddingBlock: "clamp(36px, 5.5vw, 64px)" }}>
          <div className="v2-wrap">
            <p className="v2-eyebrow">Портфолио · към {KAM_DATA}</p>
            <h1 className="v2-title mt-3" style={{ fontSize: "clamp(2rem, 5.6vw, 3.6rem)", lineHeight: 1.05 }}>
              Работата ни. <span className="v2-grad">Без имена — само резултатът.</span>
            </h1>
            <p className="mt-4 max-w-[62ch] text-[16px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>
              Видеа, реклами и системи, които направихме за клиенти — плюс пробни видеа преди първата среща. Без имената на клиентите, без телефони и лица — показваме работата, не хората. Клиентите ни се доверяват и с това.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {chisla.map((c) => (
                <div key={c.tekst} className="v2-card flex flex-col gap-1 p-5">
                  <span className="v2-grad text-[clamp(2rem,4.5vw,3rem)] font-extrabold leading-none tracking-tight">{c.stoinost}</span>
                  <span className="text-[14px] font-semibold leading-snug" style={{ color: "var(--v2-ink)" }}>{c.tekst}</span>
                </div>
              ))}
            </div>
            <p className="v2-mono mt-4 text-[11px] leading-relaxed" style={{ color: "var(--v2-faint)" }}>
              🤖 AI съдържанието е обозначено в самото видео (EU AI Act, чл. 50) · клиповете са съкратени и без звук · екраните на системите са с демо данни
            </p>
          </div>
        </section>

        <section className="v2-section" style={{ paddingBlock: "clamp(8px, 2vw, 24px) clamp(40px, 6vw, 80px)" }}>
          <div className="v2-wrap">
            <PortfolioGrid videa={VIDEA} sistemi={SISTEMI} />
          </div>
        </section>

        <section id="v-deistvie" className="v2-section" style={{ paddingBlock: "clamp(40px, 6vw, 80px)" }}>
          <div className="v2-wrap">
            <div className="v2-head" style={{ marginBottom: "clamp(22px, 3.5vw, 36px)" }}>
              <p className="v2-eyebrow">Със звук</p>
              <h2 className="v2-title-plain">Системите в действие</h2>
              <p className="max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>
                Как AI звъни на новото запитване до минути, как изглежда командният център и как собственикът получава пълен отчет с глас. Видеата с AI глас са обозначени в самото видео.
              </p>
            </div>
            <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {vDeistvie.map((v) => <VideoKarta key={v.slug} v={v} kade="portfolio" />)}
            </div>
            <p className="mt-6 text-[14px]" style={{ color: "var(--v2-muted)" }}>
              Още числа и кадри зад кадър —{" "}
              <Link href="/uspehi" className="text-[var(--v2-cyan)] underline decoration-[var(--v2-cyan)]/40 underline-offset-4">
                Успехи
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="v2-section" style={{ paddingBlock: "clamp(48px, 7vw, 96px)" }}>
          <div className="v2-wrap">
            <div className="v2-card flex flex-col items-start gap-5 p-7 sm:p-10">
              <p className="v2-eyebrow">Следващата стъпка</p>
              <h2 className="v2-title-plain" style={{ fontSize: "clamp(1.6rem, 3.6vw, 2.4rem)" }}>Искаш същото за твоята фирма?</h2>
              <p className="max-w-[58ch] text-[15.5px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>
                Безплатен AI одит · 45 минути. Показваме ти на живо какво ще поемат видеата, рекламите и AI агентите във твоя бизнес — и какво пробно видео можем да направим от материала, който вече имаш.
              </p>
              <Link href="/booking?utm_source=site&utm_medium=portfolio" className="v2-btn v2-btn-primary is-lg">
                Избери час <span className="v2-arrow">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <FooterV2 />
    </div>
  );
}
