import type { Metadata } from "next";

import { PageSchema } from "@/components/seo/PageSchema";

export const metadata: Metadata = {
  alternates: { canonical: "/robot" },
  title: "Робот-работник, който говори български · скоро",
  description:
    "Хуманоиден робот-работник с AI: носи, подрежда, разнася и говори с хората на български. Поръчките се отварят скоро — запиши се първи.",
  openGraph: {
    title: "Робот-работник, който говори български — скоро",
    description: "Още е под покривалото. Запиши се първи и научи всичко преди всички.",
    type: "website",
    locale: "bg_BG",
  },
};

export default function RobotLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageSchema
        path="/robot"
        name="Поръчай робот-работник, който говори български"
        description="Хуманоиден робот-работник с AI: върши физическа работа и разговаря с хората на български. Поръчките се отварят скоро."
        crumb="Робот"
      />
      {children}
    </>
  );
}
