import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PODARACI, PODARACI_BASE, PODARACI_ORIGIN } from "@/lib/uebinar/podaraci";
import { GiftFoot, GiftTop } from "@/components/uebinar/podaraci/GiftShell";

export const metadata: Metadata = {
  title: { absolute: "Твоите 5 подаръка · Допълнителен доход с AI" },
  alternates: { canonical: `${PODARACI_ORIGIN}${PODARACI_BASE}` },
};

/** ivailopetev.com/podaraci — петте подаръка на едно място. */
export default function Page() {
  return (
    <>
      <GiftTop />
      <header className="pd-hero">
        <div className="nz-wrap">
          <p className="pd-eyebrow">
            <span aria-hidden>🎁</span> Само за останалите до края
          </p>
          <h1 className="pd-h1">
            Ти остана до края. <em>Ето твоите 5 подаръка.</em>
          </h1>
          <p className="pd-hero-sub">
            Благодаря ти, че беше с мен на обучението „Допълнителен доход с AI“. Започни от теста — отнема 3 минути. Другите са
            твои и ги отваряш, когато ти потрябват.
          </p>
          <div className="pd-from">
            <Image src="/images/ivailo/IMG_7318.jpeg" alt="" width={88} height={88} sizes="44px" className="pd-ava" />
            <span>
              <b>Ивайло Петев</b>
              <small>водещ на обучението</small>
            </span>
          </div>
        </div>
      </header>

      <main id="top">
        <ul className="pd-grid">
          {PODARACI.map((p) => (
            <li key={p.id}>
              <article
                className={`pd-card${p.id === "test" ? " pd-card-feature" : ""}${p.id === "tombola" ? " pd-card-ticket" : ""}`}
              >
                <span className="pd-ico" aria-hidden>
                  {p.emoji}
                </span>
                <p className="pd-kind">
                  №{p.n} · {p.kind}
                </p>
                <h2 className="pd-name">{p.name}</h2>
                <p className="pd-body">{p.body}</p>
                {p.href ? (
                  <Link href={p.href} className="nz-btn pd-btn-sm pd-stretch">
                    {p.cta}
                  </Link>
                ) : (
                  <p className="pd-live">
                    <i aria-hidden /> Теглим на живо в края на обучението
                  </p>
                )}
              </article>
            </li>
          ))}
        </ul>

        <section className="pd-doc pd-sec">
          <div className="pd-letter">
            <p className="pd-letter-h">Едно последно нещо</p>
            <p>
              Подаръците работят само ако ги ползваш. Направи теста още тази вечер. Утре отвори наръчника и сметни какво ти носят
              петима клиенти.
            </p>
            <p>Първият клиент е най-трудният. После става навик.</p>
            <p className="pd-letter-sig">
              Успех! <b>— Ивайло</b>
            </p>
          </div>
        </section>
      </main>

      <GiftFoot />
    </>
  );
}
