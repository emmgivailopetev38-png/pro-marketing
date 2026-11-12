import type { Metadata } from "next";
import { VslLanding } from "@/components/vsl/VslLanding";
import { VSL, cleanName } from "@/lib/site/vsl";

/**
 * VSL 2 · „Пари с AI“ — за хора на работа, които искат втори доход.
 * Линкът го праща Георги на човека, с когото говори (виж lib/site/vsl.ts).
 * Не се индексира — личен линк, не страница за Google.
 */
const c = VSL["pari-s-ai"];

export const metadata: Metadata = {
  alternates: { canonical: "/pari-s-ai" },
  robots: { index: false, follow: false },
  title: c.metaTitle,
  description: c.metaDescription,
  openGraph: {
    title: c.metaTitle,
    description: c.metaDescription,
    type: "website",
    url: "/pari-s-ai",
    images: [{ url: c.og, width: 1200, height: 630, alt: c.metaTitle }],
  },
  twitter: { card: "summary_large_image", title: c.metaTitle, description: c.metaDescription, images: [c.og] },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  return <VslLanding c={c} name={cleanName(sp.ime)} toIvailo={sp.ot === "ivailo"} />;
}
