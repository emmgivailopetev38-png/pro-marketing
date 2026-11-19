"use client";
import { useEffect, useRef, useState } from "react";
import type { UebinarVideo } from "@/lib/uebinar/config";

/** Ключът на човека — помни се в браузъра, за да не попълва формата втори път. */
const KEY = "pm_uebinar_k";
/** Кои четвъртини вече са пратени от този браузър днес. */
const SENT = "pm_uebinar_sent";
/** Докъде е стигнал — за да продължи оттам. */
const POS = "pm_uebinar_pos";

function local(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function beacon(k: string, pct: number) {
  const body = JSON.stringify({ k, pct });
  try {
    if (navigator.sendBeacon?.("/api/uebinar/track", new Blob([body], { type: "text/plain" }))) return;
  } catch {}
  void fetch("/api/uebinar/track", { method: "POST", body, keepalive: true }).catch(() => {});
}

function Player({ k, video }: { k: string; video: UebinarVideo | null }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || !video || navigator.webdriver) return;
    const day = new Date().toISOString().slice(0, 10);
    const s = local();
    let sent = new Set<number>();
    try {
      const saved = JSON.parse(s?.getItem(SENT) ?? "{}") as { day?: string; pct?: number[] };
      if (saved.day === day) sent = new Set(saved.pct ?? []);
    } catch {}
    const mark = (pct: number) => {
      if (sent.has(pct)) return;
      sent.add(pct);
      s?.setItem(SENT, JSON.stringify({ day, pct: [...sent] }));
      beacon(k, pct);
    };
    // Продължава оттам, докъдето е стигнал в този браузър.
    const onMeta = () => {
      const at = Number(s?.getItem(POS) ?? 0);
      if (at > 10 && v.duration && at < v.duration - 20) v.currentTime = at;
    };
    let lastSave = 0;
    const onPlay = () => mark(0);
    const onTime = () => {
      if (!v.duration || !isFinite(v.duration)) return;
      if (Math.abs(v.currentTime - lastSave) > 5) {
        lastSave = v.currentTime;
        s?.setItem(POS, String(Math.floor(v.currentTime)));
      }
      const r = v.currentTime / v.duration;
      if (r >= 0.25) mark(25);
      if (r >= 0.5) mark(50);
      if (r >= 0.75) mark(75);
      if (r >= 0.97) mark(100);
    };
    const onEnd = () => mark(100);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("play", onPlay);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnd);
    };
  }, [k, video]);

  // 1080p само на широк екран — иначе 720p (по-лек за телефона и мобилните данни).
  const src = video ? (video.v1080 && typeof window !== "undefined" && window.innerWidth >= 1100 ? video.v1080 : video.v720) : null;

  return (
    <div className="screen">
      {src ? (
        <video ref={ref} src={src} poster={video?.poster ?? undefined} controls playsInline preload="metadata" />
      ) : (
        <div className="soon">
          <div>
            <b>Филмът се зарежда в залата</b>
            <br />
            Опитай пак след няколко минути.
          </div>
        </div>
      )}
    </div>
  );
}

function After() {
  return (
    <div className="after">
      <div className="card">
        <p>
          <strong>Видя нещо, което искаш при теб?</strong> 45 минути с Ивайло — показвам ти го на твоя бизнес, без
          ангажимент.
        </p>
        <a className="btn" href="/booking?utm_source=uebinar&utm_medium=film&utm_campaign=valnata">
          Запази 45 минути →
        </a>
      </div>
      <div className="card">
        <p>Всеки ден в 9:00 пускам по едно AI нещо в Viber канала „AI България · Пари с AI“.</p>
        <a className="btn ghost" href="https://promarketing.pw/viber">
          💬 Влез в канала
        </a>
      </div>
    </div>
  );
}

export function UebinarRoom({
  known,
  video: initialVideo,
}: {
  known: { k: string; name: string | null } | null;
  video: UebinarVideo | null;
}) {
  const [k, setK] = useState<string | null>(known?.k ?? null);
  const [video, setVideo] = useState<UebinarVideo | null>(initialVideo);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Личният линк печели; иначе — ключът от предишно записване в този браузър.
  useEffect(() => {
    if (known) {
      local()?.setItem(KEY, known.k);
      return;
    }
    const saved = local()?.getItem(KEY) ?? "";
    if (!/^[0-9a-f]{8}$/.test(saved)) return;
    void fetch(`/api/uebinar/video?k=${saved}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { video?: UebinarVideo | null } | null) => {
        if (j?.video) {
          setVideo(j.video);
          setK(saved);
        }
      })
      .catch(() => {});
  }, [known]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/uebinar/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: f.get("full_name"), email: f.get("email"), phone: f.get("phone") }),
      });
      const j = (await r.json().catch(() => null)) as { ok?: boolean; k?: string; video?: UebinarVideo | null; error?: string } | null;
      if (!r.ok || !j?.ok || !j.k) throw new Error(j?.error || "Опитай пак след малко.");
      local()?.setItem(KEY, j.k);
      setVideo(j.video ?? null);
      setK(j.k);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Опитай пак след малко.");
    } finally {
      setBusy(false);
    }
  }

  if (k) {
    return (
      <>
        {known?.name ? <p className="hi">Здравей, {known.name} — пусни го, когато имаш 30 минути за себе си.</p> : null}
        <Player k={k} video={video} />
        <After />
      </>
    );
  }

  return (
    <form className="gate" onSubmit={submit}>
      <h2>Къде да ти пусна филма?</h2>
      <p>Три полета и залата се отваря веднага. Спреш ли по средата — от същия браузър продължаваш, без да попълваш пак.</p>
      <label>
        Име
        <input name="full_name" autoComplete="name" required minLength={2} maxLength={120} />
      </label>
      <label>
        Имейл
        <input name="email" type="email" autoComplete="email" required maxLength={200} />
      </label>
      <label>
        Телефон
        <input name="phone" type="tel" autoComplete="tel" required minLength={6} maxLength={40} />
      </label>
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Отварям залата…" : "Гледай филма →"}
      </button>
      {err ? <p className="err">{err}</p> : null}
      <small>
        Данните ти стоят само при нас — виж <a href="/privacy">поверителността</a>. Всяко наше писмо има бутон „спри“ —
        един клик и спираме.
      </small>
    </form>
  );
}
