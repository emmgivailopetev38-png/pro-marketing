import type { Metadata } from "next";
import { Unbounded, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { MetaPixel } from "@/components/effects/MetaPixel";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "swap",
  variable: "--font-display",
  weight: ["500", "700", "800"],
});

const interTight = Inter_Tight({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "swap",
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "ProMarketing LTD — AI автоматизации за бизнеса",
  description:
    "Автоматизирай рутината с AI агенти. Поверявай ни процеси, връщай си времето. Запази безплатна консултация.",
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim()) ||
      "https://promarketing.pw"
  ),
  openGraph: {
    type: "website",
    locale: "bg_BG",
    siteName: "ProMarketing LTD",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="bg"
      className={`${unbounded.variable} ${interTight.variable} ${jetbrains.variable}`}
    >
      <body>
        <a
          href="#top"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[var(--color-accent-cyan)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--color-bg-void)] focus:outline-none"
        >
          Прескочи към съдържанието
        </a>
        <MetaPixel />
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
