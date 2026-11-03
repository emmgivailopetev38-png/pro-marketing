/* /uspehi — „Успехи, видеа и зад кадър" (03.11.2026, Ивайло: „всички наши успехи…
   галерия… да качим на уебсайта за по-високо доверие… видео съдържание").
   Данните: lib/site/uspehi.ts (числа с дата, видеа с AI етикет, истински кадри). */

import "../v2/v2-design.css";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { NavbarV2 } from "@/components/landing/v2/NavbarV2";
import { ChislaRed } from "@/components/landing/v2/UspehiV3";
import { DovolniKlientiV3 } from "@/components/landing/v2/DovolniKlientiV3";
import { ClientsV2 } from "@/components/landing/v2/ClientsV2";
import { VideoKarta } from "@/components/uspehi/VideoKarta";
import { Galeria } from "@/components/uspehi/Galeria";
import { GALERIA, SABITIA, VIDEA, redChisla } from "@/lib/site/uspehi";

const FooterV2 = dynamic(() => import("@/components/landing/v2/FooterV2").then((m) => ({ default: m.FooterV2 })));

export const metadata: Metadata = {
  title: "Успехи, видеа и зад кадър | ProMarketing",
  description: "56 проведени срещи от август, 23 клиента, 7 активни месечни услуги. Видеа как AI отговаря на клиенти, звъни до минути и пуска отчет всяка сутрин — и кадри зад кадър с Ивайло Петев.",
  alternates: { canonical: "/uspehi" },
  openGraph: { title: "Успехи, видеа и зад кадър · ProMarketing", description: "Резултати от нашия CRM, видеа от системата и кадри зад кадър.", images: ["/videa/komanden-centar.jpg"] },
};

const Sekcia = ({ id, eyebrow, title, sub, children }: { id: string; eyebrow: string; title: string; sub?: string; children: React.ReactNode }) => (
  <section id={id} className="v2-section" style={{ paddingBlock: "clamp(40px, 6vw, 80px)" }}>
    <div className="v2-wrap">
      <div className="v2-head" style={{ marginBottom: "clamp(22px, 3.5vw, 36px)" }}>
        <p className="v2-eyebrow">{eyebrow}</p>
        <h2 className="v2-title-plain">{title}</h2>
        {sub && <p className="max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>{sub}</p>}
      </div>
      {children}
    </div>
  </section>
);

export default function UspehiPage() {
  return (
    <div data-v2 className="v2-scope" style={{ background: "var(--v2-void)", minHeight: "100vh" }}>
      <NavbarV2 />
      <main data-v2 style={{ paddingTop: 90 }}>
        <section className="v2-section" style={{ paddingBlock: "clamp(40px, 6vw, 72px)" }}>
          <div className="v2-wrap">
            <p className="v2-eyebrow">Успехи · към {redChisla().split("към ")[1]}</p>
            <h1 className="v2-title mt-3" style={{ fontSize: "clamp(2rem, 5.6vw, 3.6rem)", lineHeight: 1.05 }}>
              Не обещания. <span className="v2-grad">Резултати, които се виждат.</span>
            </h1>
            <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>
              Числата са от нашия CRM и рекламния ни акаунт. Видеата са заснети от мен, с истинските екрани и гласовете на системата. Кадрите са зад кадър — от колата, на път, между срещите.
            </p>
            <div className="mt-8"><ChislaRed /></div>
            <p className="v2-mono mt-3 text-[11px]" style={{ color: "var(--v2-faint)" }}>{redChisla()}</p>
          </div>
        </section>

        <Sekcia id="videa" eyebrow="Видеа" title="Системата в действие" sub="Как AI отговаря на клиентите ти, звъни на новото запитване до минути и ти дава пълен отчет — с глас. Видеата с AI глас са обозначени в самото видео.">
          <div className="mx-auto grid max-w-[900px] gap-5 sm:grid-cols-2">
            {VIDEA.filter((v) => v.format === "4x5").map((v) => <VideoKarta key={v.slug} v={v} kade="uspehi" />)}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VIDEA.filter((v) => v.format === "9x16").map((v) => <VideoKarta key={v.slug} v={v} kade="uspehi" />)}
          </div>
        </Sekcia>

        <Sekcia id="zad-kadar" eyebrow="Зад кадър" title="Как изглежда денят ми" sub="Истински кадри — без стокови снимки. Плюс слайдовете от презентацията, която показвам на срещите (таблата в нея са с демо данни).">
          <Galeria snimki={GALERIA} />
        </Sekcia>

        {SABITIA.length > 0 && (
          <Sekcia id="sabitia" eyebrow="Конференции и събития" title="Там, където се говори за AI и маркетинг">
            {SABITIA.map((s) => (
              <div key={s.ime} className="mb-10">
                <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--v2-ink)" }}>{s.ime} <span className="v2-mono text-[12px] font-normal" style={{ color: "var(--v2-faint)" }}>· {s.data} · {s.myasto}</span></h3>
                <Galeria snimki={s.snimki} />
              </div>
            ))}
          </Sekcia>
        )}

        <DovolniKlientiV3 />
        <ClientsV2 />

        <section className="v2-section" style={{ paddingBlock: "clamp(48px, 7vw, 96px)" }}>
          <div className="v2-wrap">
            <div className="v2-card flex flex-col items-start gap-5 p-7 sm:p-10">
              <p className="v2-eyebrow">Следващата стъпка</p>
              <h2 className="v2-title-plain" style={{ fontSize: "clamp(1.6rem, 3.6vw, 2.4rem)" }}>Безплатен AI одит · 45 минути</h2>
              <p className="max-w-[58ch] text-[15.5px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>
                Показваме ти на живо какво ще поеме AI във твоята фирма — отговорите на клиенти, обажданията, рекламите и отчетите. За фирми с екип и поток от клиенти.
              </p>
              <Link href="/booking?utm_source=site&utm_medium=uspehi" className="v2-btn v2-btn-primary is-lg">
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
