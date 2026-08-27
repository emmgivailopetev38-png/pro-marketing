import type { Metadata } from "next";

import { PageSchema } from "@/components/seo/PageSchema";
export const metadata: Metadata = {
  alternates: { canonical: "/jarvis" },
  title: "Jarvis — AI асистентът от бъдещето",
  description:
    "Запознай се с Jarvis: AI асистентът, който управлява целия ти бизнес — отговаря на клиенти, насрочва срещи, пуска реклами, издава фактури и докладва. 24/7.",
  openGraph: {
    title: "Jarvis — AI асистентът от бъдещето",
    description:
      "AI асистентът, който управлява целия ти бизнес двигател — 24/7, без почивен ден. Говори с него на живо.",
    type: "website",
    locale: "bg_BG",
  },
};

export default function JarvisLayout({ children }: { children: React.ReactNode }) {
    return (
    <>
      <PageSchema path="/jarvis" name="Jarvis — AI асистентът от бъдещето" description="AI асистентът, който отговаря на клиенти, насрочва срещи, пуска реклами и издава фактури." crumb="Jarvis" />
      {children}
    </>
  );
}
