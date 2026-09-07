import Link from "next/link";

export const metadata = {
  title: "Плащането мина · ProMarketing",
  robots: { index: false, follow: false },
};

const WHAT: Record<string, { title: string; next: string }> = {
  glas: {
    title: "Гласовият ти агент тръгва.",
    next: "До края на деня Ивайло ти пише с първите въпроси: какви обаждания влизат, какво трябва да казва агентът и към кой номер да застане. Първата работеща версия я чуваш до седем работни дни.",
  },
  avtomatizacia: {
    title: "Автоматизацията тръгва.",
    next: "До края на деня Ивайло ти пише с първите въпроси за процеса, който поемаме. Работещата версия я виждаш до седем работни дни.",
  },
  crm: {
    title: "CRM-ът ти тръгва.",
    next: "До края на деня Ивайло ти пише за етапите, по които работиш, и откъде да вземем съществуващите контакти. Първият достъп го получаваш до две седмици.",
  },
};

export default async function PlatiUspehPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const what = WHAT[p ?? ""] ?? {
    title: "Плащането мина.",
    next: "До края на деня Ивайло ти пише с първите стъпки.",
  };
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-4xl">✅</p>
      <h1 className="mt-4 text-3xl font-bold text-white">{what.title}</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-slate-300">{what.next}</p>
      <p className="mt-3 text-sm text-slate-500">
        Фактурата и потвърждението от Stripe са на имейла ти. Ако нещо липсва — пиши на{" "}
        <a href="mailto:ivailo@promarketing.pw" className="underline underline-offset-2">
          ivailo@promarketing.pw
        </a>
        .
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200"
      >
        Към сайта
      </Link>
    </main>
  );
}
