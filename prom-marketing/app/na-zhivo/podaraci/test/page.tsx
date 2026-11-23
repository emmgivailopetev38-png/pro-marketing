import type { Metadata } from "next";
import { PODARACI_BASE, PODARACI_ORIGIN } from "@/lib/uebinar/podaraci";
import { AiTest } from "@/components/uebinar/podaraci/AiTest";
import { GiftFoot, GiftHero, GiftNext, GiftTop } from "@/components/uebinar/podaraci/GiftShell";

export const metadata: Metadata = {
  title: "Тест: Ще замени ли AI работата ти?",
  alternates: { canonical: `${PODARACI_ORIGIN}${PODARACI_BASE}/test` },
};

/** Подарък №1 — тестът „Ще замени ли AI работата ти?“ (всичко става в браузъра). */
export default function Page() {
  return (
    <>
      <GiftTop id="test" />
      <GiftHero
        id="test"
        title="Ще замени ли AI"
        em="работата ти?"
        sub="10 въпроса за това какво правиш всеки ден. Разбираш колко от работата ти AI вече може да върши — и какво да направиш, за да си от хората, които печелят от това."
      />
      <main id="top" className="pd-test">
        <AiTest />
      </main>
      <div className="pd-doc">
        <GiftNext id="test" />
      </div>
      <GiftFoot />
    </>
  );
}
