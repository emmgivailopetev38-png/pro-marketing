import type { Metadata } from "next";
import { Unbounded, Manrope, JetBrains_Mono } from "next/font/google";

import { PageSchema } from "@/components/seo/PageSchema";
const display = Unbounded({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--pl-display",
});
const body = Manrope({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
  variable: "--pl-body",
});
const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--pl-mono",
});

export const metadata: Metadata = {
  alternates: { canonical: "/plan" },
  title: "ProMarketing · Платформа + AI — план и цени",
  description:
    "Изграждане на бизнес платформа с изкуствен интелект — 3 фази, ясни цени и поддръжка.",
  // Досега тази страница беше noindex и същевременно стоеше в картата
  // на сайта — противоречив сигнал, който Search Console отчита като
  // грешка. Страницата е публична, обемна и линкната от менюто, значи
  // мястото ѝ е в индекса.
  robots: { index: true, follow: true },
};

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageSchema path="/plan" name="План и цени за AI платформа" description="Фази, пакети и поддръжка — как изглежда пътят от първия процес до свързана система." crumb="План и цени" />
    <div
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      style={
        {
          background: "#04060c",
          color: "#e8eef7",
          minHeight: "100vh",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
    </>
  );
}
