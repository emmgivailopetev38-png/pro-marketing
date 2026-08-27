import { ORG, abs } from "@/lib/seo/site";

import { PageSchema } from "@/components/seo/PageSchema";
/* Политика за бисквитките.

   Тази страница се сочи от долния колонтитул на целия сайт, но досега
   не съществуваше — тоест всяка страница водеше към 404. Google брои
   счупените вътрешни връзки като сигнал за изоставен сайт, а Search
   Console ги показва първи. Плюс това страницата е и задължителна,
   защото на сайта работят Meta Pixel и PostHog. */

export const metadata = {
  title: "Политика за бисквитките",
  description:
    "Какви бисквитки използва promarketing.pw, за какво служат и как да ги управляваш от браузъра си.",
  alternates: { canonical: abs("/cookies") },
};

const updatedAt = "27 август 2026 г.";

const COOKIES = [
  {
    name: "Технически (задължителни)",
    purpose:
      "Пазят сесията, езика и състоянието на формите. Без тях сайтът не работи, затова не подлежат на отказ.",
    life: "До затваряне на браузъра или до 12 месеца",
  },
  {
    name: "Meta Pixel (_fbp, _fbc)",
    purpose:
      "Отчита колко от посетителите идват от реклами във Facebook и Instagram и кои от тях стигат до запитване.",
    life: "До 90 дни",
  },
  {
    name: "PostHog (аналитика)",
    purpose:
      "Брои посещения и показва кои страници се четат. Данните се обобщават — не служат за разпознаване на конкретен човек.",
    life: "До 12 месеца",
  },
];

export default function CookiesPage() {
  return (
    <>
      <PageSchema path="/cookies" name="Политика за бисквитките" description="Какви бисквитки използва promarketing.pw и как се управляват." crumb="Бисквитки" />
    <article className="prose prose-invert max-w-none">
      <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
        Политика за бисквитките
      </h1>
      <p className="mt-3 text-sm text-[var(--color-text-tertiary)]">В сила от {updatedAt}</p>

      <p className="mt-6 text-[var(--color-text-secondary)]">
        Бисквитките са малки текстови файлове, които сайтът оставя в браузъра ти. Тук е описано
        точно какви използва <strong>{ORG.legalName}</strong> на {" "}
        <a className="text-[var(--color-accent-cyan)]" href="https://promarketing.pw">
          promarketing.pw
        </a>
        , за какво служат и как да ги изключиш.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">Какви бисквитки използваме</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-default)]">
              <th className="py-3 pr-4 font-semibold">Вид</th>
              <th className="py-3 pr-4 font-semibold">За какво служи</th>
              <th className="py-3 font-semibold">Срок</th>
            </tr>
          </thead>
          <tbody>
            {COOKIES.map((c) => (
              <tr key={c.name} className="border-b border-[var(--color-border-default)]/50">
                <td className="py-3 pr-4 align-top font-medium">{c.name}</td>
                <td className="py-3 pr-4 align-top text-[var(--color-text-secondary)]">{c.purpose}</td>
                <td className="py-3 align-top text-[var(--color-text-tertiary)]">{c.life}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 font-display text-2xl font-bold">Как да ги управляваш</h2>
      <p className="mt-4 text-[var(--color-text-secondary)]">
        Всеки браузър позволява бисквитките да се изтрият или да се блокират — обикновено в
        „Настройки → Поверителност". Изключиш ли рекламните и аналитичните, сайтът продължава да
        работи напълно нормално; спира само отчитането на това откъде си дошъл.
      </p>
      <p className="mt-4 text-[var(--color-text-secondary)]">
        Отказ от проследяването на Meta е достъпен и в настройките за реклами на самия Facebook
        акаунт, независимо от нашия сайт.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">Въпроси</h2>
      <p className="mt-4 text-[var(--color-text-secondary)]">
        Пиши ни на{" "}
        <a className="text-[var(--color-accent-cyan)]" href={`mailto:${ORG.email}`}>
          {ORG.email}
        </a>{" "}
        или се обади на {ORG.phoneDisplay}. Отговаряме в рамките на работния ден.
      </p>
      <p className="mt-8 text-sm text-[var(--color-text-tertiary)]">
        {ORG.legalName} · ЕИК {ORG.taxId} · ДДС {ORG.vatId} · {ORG.city}, България
      </p>
    </article>
    </>
  );
}
