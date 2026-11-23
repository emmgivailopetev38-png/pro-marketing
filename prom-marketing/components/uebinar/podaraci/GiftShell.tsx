/* Обвивката на всеки подарък: горна лента „← Всички подаръци“, тъмното
   начало, следващият подарък долу и бележката. Сървърни компоненти. */
import Link from "next/link";
import { PODARACI, PODARACI_BASE, sledvasht, type PodarakId } from "@/lib/uebinar/podaraci";

function podarak(id: PodarakId) {
  const p = PODARACI.find((x) => x.id === id);
  if (!p) throw new Error(`Няма подарък ${id}`);
  return p;
}

export function GiftTop({ id }: { id?: PodarakId }) {
  const p = id ? podarak(id) : null;
  return (
    <div className="pd-top" role="navigation" aria-label="Подаръците">
      <div className="pd-top-in">
        {p ? (
          <Link href={PODARACI_BASE}>
            <span aria-hidden>←</span> Всички подаръци
          </Link>
        ) : (
          <span className="pd-top-home">
            <span aria-hidden>🎁</span> Подаръците от обучението
          </span>
        )}
        <span className="pd-top-label">{p ? `Подарък №${p.n} от ${PODARACI.length}` : "Допълнителен доход с AI"}</span>
      </div>
    </div>
  );
}

export function GiftHero({
  id,
  title,
  em,
  sub,
  children,
}: {
  id: PodarakId;
  title: string;
  em?: string;
  sub: string;
  children?: React.ReactNode;
}) {
  const p = podarak(id);
  return (
    <header className="pd-hero">
      <div className="nz-wrap">
        <p className="pd-eyebrow">
          <span aria-hidden>{p.emoji}</span> Подарък №{p.n} · {p.kind}
        </p>
        <h1 className="pd-h1">
          {title}
          {em ? (
            <>
              {" "}
              <em>{em}</em>
            </>
          ) : null}
        </h1>
        <p className="pd-hero-sub">{sub}</p>
        {children}
      </div>
    </header>
  );
}

/** Текст с [местата за смяна] — оцветени, за да се виждат веднага. */
export function Tekst({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <mark key={i} className="pd-ph">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function GiftNext({ id }: { id: PodarakId }) {
  const n = sledvasht(id);
  return (
    <nav className="pd-next" aria-label="Следващ подарък">
      {n?.href ? (
        <Link href={n.href}>
          <span>
            <small>Следващ подарък · №{n.n}</small>
            <b>
              {n.emoji} {n.name}
            </b>
          </span>
          <span className="ar" aria-hidden>
            →
          </span>
        </Link>
      ) : (
        <Link href={PODARACI_BASE}>
          <span>
            <small>Това беше последният</small>
            <b>🎁 Обратно към всички подаръци</b>
          </span>
          <span className="ar" aria-hidden>
            →
          </span>
        </Link>
      )}
    </nav>
  );
}

export function GiftFoot() {
  return (
    <footer className="pd-foot">
      <p>Подаръците са за участниците в обучението „Допълнителен доход с AI“ с Ивайло Петев. Моля, не ги публикувай.</p>
      <p>Информацията е общ ориентир — не е данъчна, правна или финансова консултация и не обещава доход.</p>
      <p>
        <Link href="/privacy">Поверителност</Link> · ПроМаркетинг ЕООД
      </p>
    </footer>
  );
}
