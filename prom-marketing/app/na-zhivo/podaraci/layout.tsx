import type { Metadata, Viewport } from "next";
import "../na-zhivo.css";
import "./podaraci.css";

/**
 * /na-zhivo/podaraci — подаръците за останалите до края на обучението
 * „Допълнителен доход с AI“. Чистият адрес е https://ivailopetev.com/podaraci
 * (виж proxy.ts и lib/uebinar/domen.ts). Не се индексират — линкът се дава
 * само на живо, в края на обучението. Текстовете са в lib/uebinar/podaraci.ts
 * и lib/uebinar/ai-test.ts.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: {
    template: "%s · Подаръци · Допълнителен доход с AI",
    default: "Твоите 5 подаръка · Допълнителен доход с AI",
  },
  description: "Подаръците за участниците, останали до края на обучението „Допълнителен доход с AI“ с Ивайло Петев.",
};

export const viewport: Viewport = {
  themeColor: "#14122b",
  colorScheme: "light",
};

export default function PodaraciLayout({ children }: { children: React.ReactNode }) {
  return <div className="nz pd">{children}</div>;
}
