import { Golos_Text, Unbounded } from "next/font/google";
import type { Metadata } from "next";

/** Офертите от модули (/oferta/<код>): светла страница, Unbounded за заглавията, Golos за текста. */
const golos = Golos_Text({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--of-ui", weight: ["400", "500", "600", "700"] });
const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--of-display", weight: ["600", "700"] });

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function OfertaTokenLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${golos.variable} ${unbounded.variable} of-doc`}>{children}</div>;
}
