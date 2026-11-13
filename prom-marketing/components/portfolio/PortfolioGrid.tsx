"use client";

/* Портфолио: филтър (Всичко · Видеа за клиенти · Пробни видеа · Системи),
   видеа 9:16 без звук, които тръгват сами, когато се видят на екрана
   (и спират, когато излязат), и екрани на системите с увеличение при клик.
   Нула байта видео при зареждане — само постерите; mp4 се тегли при показване. */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, X } from "lucide-react";
import { track } from "@/lib/analytics/track";
import type { PortfolioSistema, PortfolioVideo } from "@/lib/site/portfolio";

type Filtar = "vsichko" | "klient" | "proba" | "sistemi";

const FILTRI: { k: Filtar; t: string }[] = [
  { k: "vsichko", t: "Всичко" },
  { k: "klient", t: "Видеа за клиенти" },
  { k: "proba", t: "Пробни видеа" },
  { k: "sistemi", t: "Системи" },
];

type Otvoreno = { kind: "video"; v: PortfolioVideo } | { kind: "sistema"; s: PortfolioSistema } | null;

function useReducedMotion() {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setRm(mq.matches);
    const on = () => setRm(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return rm;
}

function VideoKartaPortfolio({ v, onOpen, reduced }: { v: PortfolioVideo; onOpen: () => void; reduced: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [vyrvi, setVyrvi] = useState(false);
  const [rachnoSpryano, setRachnoSpryano] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !rachnoSpryano) {
          el.play().then(() => setVyrvi(true)).catch(() => {});
        } else {
          el.pause();
          setVyrvi(false);
        }
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, rachnoSpryano]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      setRachnoSpryano(false);
      el.play().then(() => setVyrvi(true)).catch(() => {});
      track("portfolio_video_play", { clip: v.id });
    } else {
      setRachnoSpryano(true);
      el.pause();
      setVyrvi(false);
    }
  };

  return (
    <figure className="v2-card flex min-w-0 flex-col overflow-hidden p-0" style={{ padding: 0 }}>
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "9 / 16", background: "var(--v2-void)" }}>
        <video
          ref={ref}
          poster={`/portfolio/${v.id}.jpg`}
          preload="none"
          muted
          loop
          playsInline
          aria-label={`${v.bransh}: ${v.title}`}
          className="h-full w-full object-cover"
          onClick={toggle}
        >
          <source src={`/portfolio/${v.id}.mp4`} type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20" style={{ background: "linear-gradient(180deg, transparent, rgba(4,6,13,0.55))" }} />
        <button
          type="button"
          onClick={toggle}
          aria-label={vyrvi ? `Спри: ${v.title}` : `Пусни: ${v.title}`}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur transition hover:scale-105"
          style={{ background: "rgba(4,6,13,0.6)", border: "1px solid var(--v2-line-bright)" }}
        >
          {vyrvi ? <Pause className="h-4 w-4" style={{ color: "var(--v2-cyan)" }} /> : <Play className="h-4 w-4 translate-x-[1px]" style={{ color: "var(--v2-cyan)" }} fill="currentColor" />}
        </button>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Увеличи: ${v.title}`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition hover:scale-105"
          style={{ background: "rgba(4,6,13,0.6)", border: "1px solid var(--v2-line-bright)" }}
        >
          <Maximize2 className="h-4 w-4" style={{ color: "#fff" }} />
        </button>
      </div>
      <figcaption className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="v2-mono text-[10.5px] uppercase tracking-[0.16em]" style={{ color: "var(--v2-cyan)" }}>
          {v.bransh}
        </span>
        <span className="text-[15px] font-semibold leading-snug" style={{ color: "var(--v2-ink)" }}>{v.title}</span>
        <span className="line-clamp-4 text-[13px] leading-relaxed sm:line-clamp-none" style={{ color: "var(--v2-muted)" }}>{v.what}</span>
        <span className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {v.tags.map((t) => (
            <span key={t} className="v2-mono rounded-full px-2.5 py-1 text-[10.5px]" style={{ border: "1px solid var(--v2-line)", color: "var(--v2-faint)" }}>
              {t}
            </span>
          ))}
          <span className="v2-mono rounded-full px-2.5 py-1 text-[10.5px]" style={{ border: "1px solid var(--v2-line)", color: "var(--v2-faint)" }}>
            {v.len}
          </span>
        </span>
        {v.etiket && <span className="text-[12px]" style={{ color: "var(--v2-muted)" }}>{v.etiket}</span>}
      </figcaption>
    </figure>
  );
}

function SistemaKarta({ s, onOpen }: { s: PortfolioSistema; onOpen: () => void }) {
  return (
    <figure className="v2-card flex min-w-0 flex-col overflow-hidden p-0" style={{ padding: 0 }}>
      <button type="button" onClick={onOpen} className="relative block w-full overflow-hidden" style={{ aspectRatio: "4 / 3", background: "var(--v2-void)" }} aria-label={`Увеличи: ${s.title}`}>
        <Image src={s.src} alt={`${s.title} — екран с демо данни`} fill loading="lazy" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px" className="object-cover object-top transition duration-500 hover:scale-[1.03]" />
        <span className="v2-mono absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]" style={{ background: "rgba(4,6,13,0.72)", color: "#fff", border: "1px solid var(--v2-line-bright)" }}>
          демо данни
        </span>
      </button>
      <figcaption className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="text-[15px] font-semibold leading-snug" style={{ color: "var(--v2-ink)" }}>{s.title}</span>
        <span className="text-[13px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>{s.what}</span>
        <span className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {s.tags.map((t) => (
            <span key={t} className="v2-mono rounded-full px-2.5 py-1 text-[10.5px]" style={{ border: "1px solid var(--v2-line)", color: "var(--v2-faint)" }}>
              {t}
            </span>
          ))}
        </span>
      </figcaption>
    </figure>
  );
}

const Grupa = ({ id, title, sub, children }: { id: string; title: string; sub: string; children: React.ReactNode }) => (
  <div id={id} className="mb-14 scroll-mt-28 last:mb-0">
    <div className="mb-5 flex flex-col gap-1">
      <h2 className="text-[clamp(1.25rem,2.6vw,1.6rem)] font-bold" style={{ color: "var(--v2-ink)" }}>{title}</h2>
      <p className="max-w-[62ch] text-[14.5px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>{sub}</p>
    </div>
    {children}
  </div>
);

export function PortfolioGrid({ videa, sistemi }: { videa: PortfolioVideo[]; sistemi: PortfolioSistema[] }) {
  const [f, setF] = useState<Filtar>("vsichko");
  const [otvoreno, setOtvoreno] = useState<Otvoreno>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!otvoreno) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtvoreno(null);
    window.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [otvoreno]);

  const klientski = videa.filter((v) => v.tip === "klient");
  const probni = videa.filter((v) => v.tip === "proba");
  const pokaji = (k: Filtar) => f === "vsichko" || f === k;
  const broi: Record<Filtar, number> = { vsichko: videa.length + sistemi.length, klient: klientski.length, proba: probni.length, sistemi: sistemi.length };

  const otvori = (o: Otvoreno) => {
    setOtvoreno(o);
    if (o) track("portfolio_open", { item: o.kind === "video" ? o.v.id : o.s.id, kind: o.kind });
  };

  const gridVideo = "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div>
      <div className="-mx-4 mb-8 overflow-x-auto px-4 py-1">
        <div className="flex w-max gap-2" role="tablist" aria-label="Филтър на портфолиото">
          {FILTRI.map((c) => (
            <button
              key={c.k}
              type="button"
              role="tab"
              aria-selected={f === c.k}
              onClick={() => {
                setF(c.k);
                track("portfolio_filter", { filtar: c.k });
              }}
              className="v2-mono whitespace-nowrap rounded-full px-4 py-2 text-[12px] uppercase tracking-[0.12em] transition"
              style={{
                border: "1px solid var(--v2-line)",
                background: f === c.k ? "var(--v2-cyan)" : "var(--v2-glass)",
                color: f === c.k ? "#04121a" : "var(--v2-muted)",
              }}
            >
              {c.t} · {broi[c.k]}
            </button>
          ))}
        </div>
      </div>

      {pokaji("klient") && (
        <Grupa id="videa" title="Видеа за клиенти" sub="Реклами и видеа за мрежите, които направихме за фирми от различни браншове. Тук са съкратени и без звук — без имената, телефоните и сайтовете на клиентите.">
          <div className={gridVideo}>
            {klientski.map((v) => <VideoKartaPortfolio key={v.id} v={v} reduced={reduced} onOpen={() => otvori({ kind: "video", v })} />)}
          </div>
        </Grupa>
      )}

      {pokaji("proba") && (
        <Grupa id="probni" title="Пробни видеа" sub="Правим ги преди първата среща — от материала, който фирмата вече има. Така виждаш резултата, преди да започнем.">
          <div className={gridVideo}>
            {probni.map((v) => <VideoKartaPortfolio key={v.id} v={v} reduced={reduced} onOpen={() => otvori({ kind: "video", v })} />)}
          </div>
        </Grupa>
      )}

      {pokaji("sistemi") && (
        <Grupa id="sistemi" title="Системите" sub="CRM, AI агенти, отчети и автоматизации, които строим. Екраните са с демо данни — измислени фирми, хора и числа, за да не показваме чужди клиенти.">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {sistemi.map((s) => <SistemaKarta key={s.id} s={s} onOpen={() => otvori({ kind: "sistema", s })} />)}
          </div>
        </Grupa>
      )}

      {otvoreno && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={otvoreno.kind === "video" ? otvoreno.v.title : otvoreno.s.title}
          onClick={() => setOtvoreno(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-20"
          style={{ background: "rgba(2,4,10,0.92)", backdropFilter: "blur(6px)" }}
        >
          <button type="button" aria-label="Затвори" className="absolute right-4 top-4 rounded-full p-2" style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}>
            <X className="h-6 w-6" />
          </button>
          <figure className="flex max-h-full max-w-5xl flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {otvoreno.kind === "video" ? (
              <video
                src={`/portfolio/${otvoreno.v.id}.mp4`}
                poster={`/portfolio/${otvoreno.v.id}.jpg`}
                autoPlay
                muted
                loop
                playsInline
                controls
                className="max-h-[80vh] w-auto rounded-2xl"
                style={{ aspectRatio: "9 / 16" }}
              />
            ) : (
              <Image src={otvoreno.s.src} alt={`${otvoreno.s.title} — екран с демо данни`} width={otvoreno.s.width} height={otvoreno.s.height} sizes="90vw" className="h-auto max-h-[80vh] w-auto rounded-2xl" />
            )}
            <figcaption className="max-w-[60ch] text-center text-sm text-white">
              <span className="font-semibold">{otvoreno.kind === "video" ? otvoreno.v.title : otvoreno.s.title}</span>
              <span className="block opacity-70">
                {otvoreno.kind === "video" ? `${otvoreno.v.bransh}${otvoreno.v.etiket ? ` · ${otvoreno.v.etiket}` : ""}` : "демо данни · без истински клиенти"}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
