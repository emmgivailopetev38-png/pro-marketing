import "./kino.css";
import type { Metadata, Viewport } from "next";
import { KINO } from "@/lib/kino/config";
import { premiereLabels } from "@/lib/kino/time";

const when = premiereLabels();

export const metadata: Metadata = {
  title: { absolute: `${KINO.title} · онлайн премиера — ${when.short}` },
  description: `${KINO.subtitle}. Безплатна онлайн прожекция, ${when.day}, ${when.time}. Около 40 минути филм, направен изцяло с AI, и Ивайло на живо след него.`,
  // ⚠ Без индексиране, докато Ивайло не одобри страниците (рекламите не зависят от това).
  robots: { index: false, follow: false },
  alternates: { canonical: "/kino" },
  openGraph: {
    type: "website",
    locale: "bg_BG",
    url: "/kino",
    siteName: "Pro Marketing",
    title: `${KINO.title} · онлайн премиера · ${when.short}`,
    description: `${KINO.subtitle}. Вход свободен — вземи си билет.`,
  },
};

export const viewport: Viewport = {
  themeColor: "#06060d",
  colorScheme: "dark",
};

export default function KinoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
