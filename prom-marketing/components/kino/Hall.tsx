"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { KINO, type KinoVideoSource } from "@/lib/kino/config";
import {
  kinoTimeline,
  phaseAt,
  simulivePosition,
  chapterIndexAt,
  isOfferOpen,
  splitCountdown,
  formatClock,
  premiereLabels,
  type KinoPhase,
} from "@/lib/kino/time";
import { REACTIONS, type Reaction } from "@/lib/kino/analytics";
import { postJson, beacon, safeLocal } from "@/lib/kino/browser";
import { track } from "@/lib/analytics/track";
import { useKinoClock } from "./useKinoClock";
import { KinoPlayer, type PlayerApi } from "./KinoPlayer";
import { OfferBlock, StickyOfferBar, CallPanel, useOfferActions } from "./Offer";
import { WaitingCalculator, QuestionBox, WaitlistForm, NumberBox } from "./HallWidgets";
import { PosterArt } from "./PosterArt";

/* =====================================================================
   Залата. Фоайе → вратите (19:25) → премиерата „на живо“ → живата част
   → повторението → „филмът вече не е на екран“.

   Премиерата: позицията идва от часа (simulive), не от човека. Без
   превъртане напред; изоставащ плейър се връща на живата секунда.
   Повторението: нормален плейър. Трите бутона изплуват точно в offerAt.
   Пулс на 15 s → /api/kino/track (kino_watch + етапите в CRM-а).
   ===================================================================== */

const tl = kinoTimeline();
const FILM = KINO.film;
const labels = premiereLabels();
const BEAT_MS = 15_000;

export interface HallProps {
  token: string | null;
  name: string;
  seat: { hall: number; row: number; seat: number } | null;
  initialNow: number;
  simMs: number | null;
  offerSeen: boolean;
  bonusUnlocked: boolean;
  depositPaid: number;
  bought: boolean;
  email: string | null;
  /** прегледът на Ивайло — без пулс, с жълта лента горе */
  preview: boolean;
  /** горната лента на страницата — рисува се ПОД лентата на прегледа */
  top?: React.ReactNode;
  /** филмът (Blob MP4 / HLS / YouTube) или „none“ — суха прожекция с надписи */
  video: KinoVideoSource;
  /** линкът към подаръка — идва от сървъра само на отключилите (и в прегледа) */
  bonusUrl: string | null;
  /** „Твоето число“, ако вече го е написал */
  hours: number | null;
}

type Mode = "premiere" | "live" | "replay";
type Float = { id: number; emoji: string; left: number };
type BonusData = { title: string; body: string; url: string | null };

function liveTarget(url: string | null): { kind: "youtube"; id: string } | { kind: "link"; url: string } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/))([\w-]{6,})/i);
  return yt ? { kind: "youtube", id: yt[1] } : { kind: "link", url };
}

// „Поканата е видяна“ — пази се в браузъра и оцелява презареждане.
const OFFER_EVENT = "kino-offer-seen";
function offerStore(key: string) {
  return {
    subscribe(cb: () => void) {
      window.addEventListener(OFFER_EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(OFFER_EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    get: () => safeLocal()?.getItem(key) === "1",
    set() {
      safeLocal()?.setItem(key, "1");
      window.dispatchEvent(new Event(OFFER_EVENT));
    },
  };
}

function StatusPill({ phase, pos }: { phase: KinoPhase; pos: number }) {
  if (phase === "film")
    return (
      <span className="k-pill k-pill--live">
        <span className="k-dot" /> НА ЖИВО · {formatClock(pos)}
      </span>
    );
  if (phase === "live")
    return (
      <span className="k-pill k-pill--live">
        <span className="k-dot" /> Ивайло на живо
      </span>
    );
  if (phase === "replay") return <span className="k-pill">Повторение · до {labels.replayUntilDay.split(",")[0]}, {labels.replayUntilTime}</span>;
  if (phase === "closed") return <span className="k-pill">Филмът свали</span>;
  if (phase === "doors") return <span className="k-pill k-pill--live">Вратите са отворени</span>;
  return <span className="k-pill">Фоайе · отваря в {labels.doorsTime}</span>;
}

function TitleCard({ pos, note }: { pos: number; note?: string }) {
  const ch = FILM.chapters[chapterIndexAt(pos, FILM.chapters)];
  const credits = pos >= FILM.offerAtSec;
  return (
    <div className="k-titlecard">
      <div>
        <div className="k-titlecard-n">{credits ? (pos >= FILM.postCreditsAtSec ? "СЦЕНА СЛЕД НАДПИСИТЕ" : "НАДПИСИ") : `ГЛАВА ${ch.n}`}</div>
        <div className="k-titlecard-t">{credits ? KINO.title : `„${ch.title}“`}</div>
        <div className="k-titlecard-c">
          {formatClock(pos)} / {formatClock(FILM.durationSec)}
          {note ? ` · ${note}` : ""}
        </div>
      </div>
    </div>
  );
}

export function Hall(props: HallProps) {
  const { token, preview, video } = props;
  const playable = video.kind !== "none";
  const { now } = useKinoClock({ initialMs: props.initialNow, simMs: props.simMs, tickMs: 500 });
  const phase = phaseAt(now, tl);
  const [wantReplay, setWantReplay] = useState(false);
  const mode: Mode = phase === "film" ? "premiere" : phase === "live" && !wantReplay ? "live" : "replay";
  const showsFilm = phase === "film" || ((phase === "live" || phase === "replay") && mode === "replay");
  const onScreen = showsFilm || phase === "doors";
  const livePos = simulivePosition(now, tl);

  const player = useRef<PlayerApi>(null);
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [mutedBlocked, setMutedBlocked] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const userPausedRef = useRef(false);
  const tryingPlay = useRef(false);

  // ── повторението: позицията от плейъра или от „сухия“ часовник без видео ──
  const [replayPos, setReplayPos] = useState(0);
  const [dryPlaying, setDryPlaying] = useState(false);
  useEffect(() => {
    if (mode !== "replay" || !showsFilm) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const t = performance.now();
      if (playable) {
        const p = player.current;
        if (p) setReplayPos(p.time());
      } else if (dryPlaying) {
        setReplayPos((x) => Math.min(FILM.durationSec, x + (t - last) / 1000));
      }
      last = t;
    }, 500);
    return () => window.clearInterval(id);
  }, [mode, showsFilm, dryPlaying, playable]);

  const pos = mode === "premiere" ? livePos : mode === "replay" ? replayPos : FILM.durationSec;
  const filmPlaying = mode === "premiere" ? (playable ? playing : armed) : mode === "replay" ? (playable ? playing : dryPlaying) : false;

  // Дължината на файла. По-късо видео от живата секунда (пробата с тийзъра,
  // или самият край на филма) → плейърът спира на последния кадър, не се
  // върти в кръг и не брои това за „пауза от човека“.
  const [videoDur, setVideoDur] = useState<number | null>(null);
  const pastVideoEnd = playable && mode === "premiere" && videoDur != null && livePos >= videoDur - 0.5;

  // ── поканата: точно в offerAt; видяна веднъж — остава ──
  const store = useMemo(() => offerStore(`kino_offer_${KINO.screening.id}_${token ?? "anon"}`), [token]);
  const seenLocal = useSyncExternalStore(store.subscribe, store.get, () => false);
  const offerSeen = props.offerSeen || seenLocal;
  const offerOpen =
    phase === "closed" || phase === "before" || phase === "doors"
      ? false
      : mode === "premiere"
        ? isOfferOpen(livePos)
        : mode === "live"
          ? true
          : offerSeen || isOfferOpen(replayPos);
  useEffect(() => {
    if (offerOpen && !seenLocal) {
      store.set();
      track("kino_offer_shown", { mode });
    }
  }, [offerOpen, seenLocal, store, mode]);

  // ── „Твоето число“ (сцена 9.7): полето под филма излиза от numberAtSec ──
  const [hours, setHours] = useState<number | null>(props.hours);
  const numberOpen =
    phase === "closed" || phase === "before" || phase === "doors"
      ? false
      : mode === "premiere"
        ? livePos >= FILM.numberAtSec || hours != null
        : mode === "live"
          ? true
          : replayPos >= FILM.numberAtSec || hours != null || offerSeen;

  const posRef = useRef(pos);
  const stateRef = useRef({ phase, mode, pos, playing: filmPlaying });
  useEffect(() => {
    posRef.current = pos;
    stateRef.current = { phase, mode, pos, playing: filmPlaying };
  });
  const getPos = useCallback(() => posRef.current, []);
  const actions = useOfferActions({ token: preview ? null : token, from: "zala", pos: getPos });

  // ── премиерата: плейърът върви по часа ──
  useEffect(() => {
    const p = player.current;
    if (!playable || !p || phase !== "film" || !armed || userPausedRef.current) return;
    const dur = p.duration();
    if (dur != null && livePos >= dur - 0.5) {
      if (p.playing()) p.pause();
      return;
    }
    if (Math.abs(p.time() - livePos) > 3) p.seek(livePos);
    if (!p.playing() && !tryingPlay.current) {
      tryingPlay.current = true;
      void p.play().then(async (ok) => {
        if (!ok) {
          p.setMuted(true);
          setMutedBlocked(await p.play());
        }
        tryingPlay.current = false;
      });
    }
  }, [now, phase, armed, livePos, playable]);

  // ── реакциите, които летят по екрана ──
  const [floats, setFloats] = useState<Float[]>([]);
  const floatId = useRef(0);
  const spawn = useCallback((emoji: string, n = 1) => {
    const items: Float[] = Array.from({ length: Math.min(n, 8) }, () => ({ id: ++floatId.current, emoji, left: 8 + Math.random() * 84 }));
    setFloats((f) => [...f.slice(-24), ...items]);
    window.setTimeout(() => setFloats((f) => f.filter((x) => !items.some((i) => i.id === x.id))), 2700);
  }, []);

  // ── пулсът ──
  const lastBeat = useRef(0);
  const sendBeat = useCallback(
    (viaBeacon = false) => {
      if (!token || preview) return;
      const s = stateRef.current;
      if (s.phase !== "film" && s.phase !== "live" && s.phase !== "replay") return;
      const t = Date.now();
      const d = lastBeat.current ? Math.min(20, (t - lastBeat.current) / 1000) : 0;
      lastBeat.current = t;
      const body = {
        k: "beat",
        t: token,
        pos: Math.round(s.pos),
        d: s.playing ? Math.round(d) : 0,
        mode: s.mode,
        vis: document.visibilityState === "visible",
        play: s.playing,
      };
      if (viaBeacon) return beacon("/api/kino/track", body);
      void postJson<{ recent?: Record<string, number> }>("/api/kino/track", body).then(({ data }) => {
        for (const [emoji, count] of Object.entries(data.recent ?? {})) if (count > 0) spawn(emoji, count);
      });
    },
    [token, preview, spawn],
  );

  useEffect(() => {
    if (!token || preview) return;
    const id = window.setInterval(() => sendBeat(), BEAT_MS);
    const onVis = () => document.visibilityState === "hidden" && sendBeat(true);
    const onHide = () => sendBeat(true);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
    };
  }, [token, preview, sendBeat]);

  // Първият пулс — веднага щом човекът реално е в залата (не след 15 s).
  const firstBeatSent = useRef(false);
  useEffect(() => {
    if (firstBeatSent.current) return;
    if ((phase === "film" && armed) || (phase === "live" && mode === "live") || (mode === "replay" && filmPlaying)) {
      firstBeatSent.current = true;
      sendBeat();
    }
  }, [phase, armed, mode, filmPlaying, sendBeat]);

  // ── бонусът след надписите ──
  const reachedBonus = showsFilm && pos >= FILM.postCreditsAtSec + 15;
  const defaultBonus: BonusData = { title: KINO.bonus.title, body: KINO.bonus.body, url: props.bonusUrl };
  const [bonus, setBonus] = useState<{ state: "locked" | "open" | "more"; data?: BonusData }>(
    props.bonusUnlocked ? { state: "open", data: defaultBonus } : { state: "locked" },
  );
  const bonusAsked = useRef(false);
  useEffect(() => {
    if (!reachedBonus || bonus.state !== "locked" || !token || preview || bonusAsked.current) return;
    bonusAsked.current = true;
    void postJson<{ unlocked?: boolean; reason?: string; bonus?: BonusData }>("/api/kino/track", {
      k: "ev",
      t: token,
      type: "bonus",
      pos: Math.round(posRef.current),
    }).then(({ data }) => {
      if (data.unlocked) {
        setBonus({ state: "open", data: data.bonus ?? defaultBonus });
        track("kino_bonus");
      } else if (data.reason === "watch-more") {
        setBonus({ state: "more" });
      } else {
        // грешка/мрежа — пак при следващото стигане до края
        bonusAsked.current = false;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaultBonus е от конфигурацията
  }, [reachedBonus, bonus.state, token, preview]);
  // „Догледай още“ не е окончателно: след минута пита пак (ако е догледал главите — отключва).
  useEffect(() => {
    if (bonus.state !== "more") return;
    const id = window.setTimeout(() => {
      bonusAsked.current = false;
      setBonus({ state: "locked" });
    }, 60_000);
    return () => window.clearTimeout(id);
  }, [bonus.state]);
  const bonusOpen = bonus.state === "open" || ((!token || preview) && reachedBonus);
  const bonusData = bonus.data ?? defaultBonus;

  // ── действията ──
  const lastReact = useRef(0);
  const react = useCallback(
    (emoji: Reaction) => {
      const t = Date.now();
      if (t - lastReact.current < 600) return;
      lastReact.current = t;
      spawn(emoji);
      if (token && !preview) void postJson("/api/kino/track", { k: "ev", t: token, type: "reaction", value: emoji, pos: Math.round(posRef.current) });
    },
    [token, preview, spawn],
  );

  async function enter() {
    setArmed(true);
    userPausedRef.current = false;
    setUserPaused(false);
    track("kino_enter", { phase });
    const p = player.current;
    if (!p || !playable) return;
    if (phase === "film") {
      p.seek(livePos);
      if (!(await p.play())) {
        p.setMuted(true);
        setMutedBlocked(await p.play());
      }
    } else {
      // фоайето: кратко пускане „отключва“ звука за началото (iOS / Chrome)
      if (await p.play()) p.pause();
    }
  }

  function backToLive() {
    userPausedRef.current = false;
    setUserPaused(false);
    const p = player.current;
    if (p) {
      p.seek(livePos);
      void p.play();
    }
  }

  async function unmute() {
    const p = player.current;
    if (!p) return;
    p.setMuted(false);
    await p.play();
    setMutedBlocked(false);
  }

  function startReplay() {
    setWantReplay(true);
    track("kino_replay_from_live");
    window.setTimeout(() => {
      player.current?.seek(0);
      void player.current?.play();
    }, 400);
  }

  function seekChapter(sec: number) {
    if (mode !== "replay") return;
    if (playable) player.current?.seek(sec);
    setReplayPos(sec);
  }

  function onPlayerState(p: boolean) {
    setPlaying(p);
    const dur = player.current?.duration() ?? null;
    const atEnd = dur != null && posRef.current >= dur - 1;
    if (!p && phase === "film" && armed && !tryingPlay.current && !atEnd) {
      userPausedRef.current = true;
      setUserPaused(true);
    }
  }

  // главата в средата на лентата
  const chapterIdx = chapterIndexAt(pos, FILM.chapters);
  const chapterStrip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = chapterStrip.current;
    const el = strip?.querySelector<HTMLElement>('[data-now="1"]');
    if (el && strip) strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [chapterIdx, showsFilm]);

  const live = useMemo(() => liveTarget(KINO.liveUrl), []);
  const cd = splitCountdown(tl.premiereMs - now);
  const [closedCall, setClosedCall] = useState(false);
  const simLinks = ["lobby", "doors", "film", "film:1950", "offer", "bonus", "live", "replay", "closed"];

  return (
    <>
      {preview && (
        <div className="k-sim" role="note">
          ПРЕГЛЕД · симулиран час ({phase}) — без пулс и без записи.{" "}
          <span className="k-sim-links">
            {simLinks.map((s) => (
              <a key={s} href={`?${token ? `t=${encodeURIComponent(token)}&` : ""}sim=${encodeURIComponent(s)}`}>
                {s}
              </a>
            ))}
          </span>
        </div>
      )}
      {props.top}

      <div className="k-wrap k-hall">
        <div className="k-hall-head">
          <div>
            <div className="k-hall-title">{KINO.title}</div>
            <div className="k-seat">
              {props.seat
                ? `${props.name.split(/\s+/)[0] || "Твоето"} · Зала ${props.seat.hall} · Ред ${props.seat.row} · Място ${props.seat.seat}`
                : "Зала 1"}
            </div>
          </div>
          <StatusPill phase={phase} pos={pos} />
        </div>

        {/* ── ФОАЙЕТО (до 19:25) ── */}
        {phase === "before" && (
          <>
            <div className="k-screen">
              {KINO.trailer.kind !== "none" ? (
                <KinoPlayer source={KINO.trailer} controls ambient title="Трейлър" />
              ) : (
                <PosterArt id="hall-poster" className="k-poster" />
              )}
            </div>
            <div className="k-panel" style={{ marginTop: 16, textAlign: "center" }}>
              <p className="k-h3">
                Премиерата започва {labels.onDay}, в {labels.time}
              </p>
              <div className="k-count" style={{ margin: "14px auto 0" }}>
                {(
                  [
                    [cd.days, "дни"],
                    [cd.hours, "часа"],
                    [cd.minutes, "мин"],
                    [cd.seconds, "сек"],
                  ] as Array<[number, string]>
                ).map(([n, l]) => (
                  <div className="k-count-cell" key={l}>
                    <span className="k-count-num">{String(n).padStart(2, "0")}</span>
                    <span className="k-count-label">{l}</span>
                  </div>
                ))}
              </div>
              <p className="k-muted" style={{ margin: "14px 0 0" }}>
                Залата отваря вратите в {labels.doorsTime}. Остави таба отворен или се върни по линка от билета.
              </p>
            </div>
          </>
        )}

        {/* ── ЕКРАНЪТ: вратите, премиерата, повторението — един и същ плейър ── */}
        {onScreen && (
          <>
            <div className="k-screen">
              {video.kind !== "none" ? (
                <KinoPlayer
                  ref={player}
                  source={video}
                  controls={mode === "replay" && phase !== "doors"}
                  title={KINO.title}
                  onStateChange={onPlayerState}
                  onMeta={setVideoDur}
                />
              ) : (
                <TitleCard pos={pos} note={preview || process.env.NODE_ENV !== "production" ? "проба без филм" : undefined} />
              )}
              {pastVideoEnd && armed && (
                <div className="k-screen-cover">
                  <TitleCard pos={pos} note={preview || process.env.NODE_ENV !== "production" ? "пробното видео свърши — залата продължава по часа" : undefined} />
                </div>
              )}

              {phase === "doors" && (
                <div className="k-leader">
                  <div className="k-leader-ring">
                    <span className={`k-leader-num${cd.totalSec > 59 ? "" : " k-leader-num--big"}`}>
                      {cd.totalSec > 59 ? `${cd.minutes}:${String(cd.seconds).padStart(2, "0")}` : cd.seconds}
                    </span>
                  </div>
                </div>
              )}

              <div className="k-floats" aria-hidden="true">
                {floats.map((f) => (
                  <span key={f.id} className="k-float" style={{ left: `${f.left}%` }}>
                    {f.emoji}
                  </span>
                ))}
              </div>

              {mode === "premiere" && !armed && (
                <div className="k-overlay">
                  <div className="k-overlay-inner">
                    <p className="k-overlay-title">Филмът върви от {formatClock(livePos)}</p>
                    <p className="k-muted" style={{ margin: "0 0 14px" }}>
                      Влизаш в текущата минута — като в истинско кино. Началото те чака в повторението.
                    </p>
                    <button type="button" className="k-btn k-btn--primary" onClick={enter}>
                      🔊 Влез в залата
                    </button>
                  </div>
                </div>
              )}
              {mode === "premiere" && armed && playable && userPaused && (
                <div className="k-screen-corner">
                  <button type="button" className="k-icon-btn" onClick={backToLive}>
                    ● Върни се на живо
                  </button>
                </div>
              )}
              {mutedBlocked && (
                <div className="k-screen-corner">
                  <button type="button" className="k-icon-btn" onClick={unmute}>
                    🔊 Пусни звука
                  </button>
                </div>
              )}
              {mode === "replay" && showsFilm && !playable && (
                <div className="k-screen-corner">
                  <button type="button" className="k-icon-btn" onClick={() => setDryPlaying((x) => !x)}>
                    {dryPlaying ? "❚❚ Пауза" : "▶ Пусни"}
                  </button>
                </div>
              )}
            </div>

            {phase === "doors" && (
              <div className="k-panel" style={{ marginTop: 16, textAlign: "center" }}>
                <p className="k-h3">Заеми мястото си — гасим светлините в {labels.time}.</p>
                <p className="k-muted" style={{ margin: "6px 0 14px" }}>
                  Натисни веднъж, за да тръгне филмът със звук точно навреме.
                </p>
                <button type="button" className="k-btn k-btn--primary" onClick={enter} disabled={armed}>
                  {armed ? "✓ Готов си — филмът тръгва сам" : "🔊 Влизам в залата"}
                </button>
              </div>
            )}

            {showsFilm && (
              <>
                <div className="k-progress" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, (pos / FILM.offerAtSec) * 100)}%` }} />
                </div>
                <div className="k-chapters" ref={chapterStrip} aria-label="Главите">
                  {FILM.chapters.map((c, i) => {
                    const cls = `k-chapter${i === chapterIdx ? " k-chapter--now" : i < chapterIdx ? " k-chapter--done" : ""}`;
                    const label = `${c.n}. ${c.title}`;
                    const now1 = i === chapterIdx ? "1" : undefined;
                    return mode === "replay" && (i <= chapterIdx || offerSeen) ? (
                      <button key={c.n} type="button" className={cls} data-now={now1} onClick={() => seekChapter(c.startSec)}>
                        {label}
                      </button>
                    ) : (
                      <span key={c.n} className={cls} data-now={now1}>
                        {label}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ── ЖИВАТА ЧАСТ ── */}
        {phase === "live" && mode === "live" && (
          <>
            <div className="k-screen">
              {live?.kind === "youtube" ? (
                <iframe
                  src={`https://www.youtube.com/embed/${live.id}?autoplay=1&playsinline=1&rel=0`}
                  title="Живата част с Ивайло"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="k-titlecard">
                  <div>
                    <div className="k-titlecard-n">НА ЖИВО</div>
                    <div className="k-titlecard-t">Ивайло влиза на живо — за въпросите ти</div>
                    {live?.kind === "link" ? (
                      <a className="k-btn k-btn--primary" style={{ marginTop: 16 }} href={live.url} target="_blank" rel="noopener">
                        ● Влез в живата част
                      </a>
                    ) : (
                      // ⚠ Линкът за живата част (NEXT_PUBLIC_KINO_LIVE_URL) — решение на Ивайло
                      <p className="k-muted" style={{ marginTop: 12 }}>Линкът се появява тук след надписите.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="k-cta-row" style={{ marginTop: 14 }}>
              <button type="button" className="k-btn" onClick={startReplay}>
                ▶ Гледай филма от началото
              </button>
            </div>
          </>
        )}

        {/* ── СВАЛЕН ── */}
        {phase === "closed" && (
          <div className="k-panel" style={{ textAlign: "center", padding: "34px 20px" }}>
            <p className="k-kicker" style={{ justifyContent: "center" }}>
              Залата е затворена
            </p>
            <h1 className="k-h2">Филмът вече не е на екран</h1>
            <p className="k-lead" style={{ marginInline: "auto" }}>
              „{KINO.title}“ беше на екран до {labels.replayUntilDay}, {labels.replayUntilTime}. Искаш ли да научиш първи за
              следващата прожекция?
            </p>
            <div style={{ maxWidth: 520, margin: "0 auto" }}>
              <WaitlistForm token={preview ? null : token} />
            </div>
            <p className="k-muted" style={{ marginTop: 22 }}>
              Искаш да поговорим за твоя бизнес?{" "}
              <button type="button" className="k-link" style={{ background: "none", border: 0, cursor: "pointer", font: "inherit" }} onClick={() => setClosedCall(true)}>
                Избери час
              </button>
            </p>
            {closedCall && (
              <div style={{ textAlign: "left" }}>
                <CallPanel token={preview ? null : token} name={props.name} email={props.email} />
              </div>
            )}
          </div>
        )}

        {/* ── ТВОЕТО ЧИСЛО — полето под филма ── */}
        {numberOpen && <NumberBox token={preview ? null : token} pos={getPos} saved={hours} onSaved={setHours} />}

        {/* ── РЕАКЦИИТЕ ── */}
        {(showsFilm || (phase === "live" && mode === "live")) && (
          <div className="k-reactions" aria-label="Реакции">
            {REACTIONS.map((r) => (
              <button key={r} type="button" className="k-react" onClick={() => react(r)} aria-label={`Реакция ${r}`}>
                {r}
              </button>
            ))}
            <span className="k-muted" style={{ fontSize: "0.85rem" }}>
              {mode === "premiere" ? "Реакциите на залата летят по екрана." : "Реагирай — броят се по минути."}
            </span>
          </div>
        )}

        {/* ── БОНУСЪТ ── */}
        {bonusOpen && (
          <div className="k-bonus" role="status">
            <p className="k-kicker" style={{ color: "#fcd34d" }}>
              Още си тук? Значи си от правилните хора.
            </p>
            <p className="k-h3" style={{ marginTop: 8 }}>
              🎁 {bonusData.title}
            </p>
            <p className="k-lead" style={{ marginTop: 6 }}>
              {bonusData.body}
            </p>
            {bonusData.url ? (
              <a className="k-btn k-btn--primary" style={{ marginTop: 14 }} href={bonusData.url} target="_blank" rel="noopener">
                Вземи подаръка
              </a>
            ) : (
              // ⚠ Бонусът (KINO_BONUS_URL, само на сървъра) — решение на Ивайло
              <p className="k-muted" style={{ marginTop: 10 }}>
                Подаръкът идва на имейла ти до 24 часа.
              </p>
            )}
          </div>
        )}
        {bonus.state === "more" && (
          <p className="k-muted" style={{ marginTop: 14 }}>
            🎁 Подаръкът след надписите е за изгледалите филма. Върни се към главите, които пропусна — и ще те чака тук.
          </p>
        )}

        {/* ── ПОКАНАТА ── */}
        {offerOpen && (
          <OfferBlock
            actions={actions}
            token={preview ? null : token}
            depositPaid={props.depositPaid}
            bought={props.bought}
            name={props.name}
            email={props.email}
            hours={hours}
          />
        )}

        {phase !== "closed" && (
          <div className="k-hall-grid">
            <QuestionBox token={preview ? null : token} pos={getPos} />
            <WaitingCalculator token={preview ? null : token} />
          </div>
        )}
      </div>

      {offerOpen && !props.bought && <StickyOfferBar actions={actions} depositPaid={props.depositPaid} />}
    </>
  );
}
