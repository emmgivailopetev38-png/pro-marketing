import type { MetadataRoute } from "next";
import { ORG } from "@/lib/seo/site";

/* Уеб манифест — прави сайта инсталируем и подава на Google
   кратко име и тема. Дребно, но е част от „сайтът изглежда завършен". */

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${ORG.name} — AI автоматизация за бизнеса`,
    short_name: ORG.name,
    description:
      "AI агенти, чатботове, гласови асистенти и CRM системи, които поемат рутината в бизнеса ти.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070d",
    theme_color: "#22d3ee",
    lang: "bg-BG",
    categories: ["business", "productivity"],
  };
}
