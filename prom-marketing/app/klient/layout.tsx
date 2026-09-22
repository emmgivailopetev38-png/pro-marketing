import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вашият проект · Pro Marketing",
  robots: { index: false, follow: false },
};

/** Порталът на клиента — без менюто на сайта, без вход; достъпът е линкът. */
export default function KlientLayout({ children }: { children: React.ReactNode }) {
  return <div className="kl-root">{children}</div>;
}
