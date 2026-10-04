import type { Metadata } from "next";

import { PageSchema } from "@/components/seo/PageSchema";

export const metadata: Metadata = {
  alternates: { canonical: "/robot" },
  title: "Поръчай робот, който говори български · скоро",
  description:
    "Хуманоиден робот с AI на ProMarketing: посреща хората, отговаря на въпроси и приема запитвания — на български. Поръчките се отварят скоро. Запиши се първи.",
  openGraph: {
    title: "Робот, който говори български — скоро",
    description: "Още е под покривалото. Запиши се първи и научи цената и датата преди всички.",
    type: "website",
    locale: "bg_BG",
  },
};

export default function RobotLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageSchema
        path="/robot"
        name="Поръчай робот, който говори български"
        description="Хуманоиден робот с AI, който разговаря на български, посреща хората и приема запитвания. Поръчките се отварят скоро."
        crumb="Робот"
      />
      {children}
    </>
  );
}
