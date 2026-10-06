"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { KinoCohortView } from "@/lib/kino/cohorts";
import { REACTIONS, type Reaction } from "@/lib/kino/analytics";
import { postJson, beacon } from "@/lib/kino/browser";
import { track } from "@/lib/analytics/track";
import { useKinoClock } from "./useKinoClock";
import { KinoPlayer, type PlayerApi } from "./KinoPlayer";
import { OfferBlock, StickyOfferBar, CallPanel, useOfferActions } from "./Offer";
import { WaitingCalculator, QuestionBox, NumberBox } from "./HallWidgets";
import { LiveJoin, useKinoLive } from "./LiveJoin";
import { PosterArt } from "./PosterArt";

/* =====================================================================
   Залата — ЕДНА прожекция, изцяло автоматична:
   фоайе → вратите (19:25) → филмът „на живо“ (с въпросите и подаръка
   накрая) → след края само поканата (до затварянето на записването)
   → „записването затвори“.

   Филмът: позицията идва от часа (simulive), не от човека. Без превъртане
   напред; закъснелият влиза в текущата минута. Повторение НЯМА.
   Трите бутона изплуват точно в offerAt (надписите).
   Пулс на 15 s → /api/kino/track (kino_watch + етапите в CRM-а; „в залата
   сега“ за Режисьорската кабина). „НА ЖИВО“ — когато Ивайло се включи.
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
  /** гледал е филма (за текста след края) */
  entered: boolean;
  bonusUnlocked: boolean;
  depositPaid: number;
  bought: boolean;
  /** може да плати и след затварянето — записан час или даден на Димитър */
  invited: boolean;
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
  /** потокът, в който влиза човекът: стартът, срокът, местата */
  cohort: KinoCohortView;
  /** прегледът: ?live=<линк> показва бутона „НА ЖИВО“ */
  simLive?: string | null;
}

type BeatMode = "doors" | "premiere" | "offer";
type Float = { id: number; emoji: string; left: number };
type BonusData = { title: string; body: string; url: string | null };

function StatusPill({ phase, pos }: { phase: KinoPhase; pos: number }) {
  if (phase === "film")
    return (
      <span className="k-pill k-pill--live">
        <span className="k-dot" /> НА ЕКРАН · {formatClock(pos)}
      </span>
    );
  if (phase === "after") return <span className="k-pill">Прожекцията свърши</span>;
  if (phase === "closed") return <span className="k-pill">Записването затвори</span>;
  if (phase === "doors") return <span className="k-pill k-pill--live">Вратите са отворени</span>;
  return <span className="k-pill">Фоайе · отваря в {labels.doorsTime}</span>;
}

/** Кое е на екрана в тази секунда: глава, надписите, въпросите или подаръкът. */
function segmentAt(pos: number): { n: string; title: string } {
  if (pos >= FILM.postCreditsAtSec) return { n: "ПОДАРЪКЪТ", title: "За останалите до края" };
  if (pos >= FILM.qaAtSec) return { n: "СЛЕД ФИЛМА", title: "Въпроси след прожекцията" };
  if (pos >= FILM.offerAtSec) return { n: "НАДПИСИ", title: KINO.title };
  const ch = FILM.chapters[chapterIndexAt(pos, FILM.chapters)];
  return { n: `ГЛАВА ${ch.n}`, title: `„${ch.title}“` };
}

function TitleCard({ pos, note }: { pos: number; note?: string }) {
  const seg = segmentAt(pos);
  return (
    <div className="k-titlecard">
      <div>
        <div className="k-titlecard-n">{seg.n}</div>
        <div className="k-titlecard-t">{seg.title}</div>
        <div className="k-titlecard-c">
          {formatClock(pos)} / {formatClock(FILM.durationSec)}
          {note ? ` · ${note}` : ""}
        </div>
      </div>
    </div>
  );
}

export function Hall(props: HallProps) {
  const { token, preview, video, cohort } = props;
  const playable = video.kind !== "none";
  const { now } = useKinoClock({ initialMs: props.initialNow, simMs: props.simMs, tickMs: 500 });
  const phase = phaseAt(now, tl);
  const inFilm = phase === "film";
  const livePos = simulivePosition(now, tl);
  const pos = inFilm ? livePos : phase === "after" || phase === "closed" ? FILM.durationSec : 0;

  const player = useRef<PlayerApi>(null);
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [mutedBlocked, setMutedBlocked] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const userPausedRef = useRef(false);
  const tryingPlay = useRef(false);
  const filmPlaying = inFilm && (playable ? playing : armed);

  // Дължината на файла. По-късо видео от живата секунда (пробата с тийзъра)
  // → плейърът спира на последния кадър, не се върти в кръг и не брои това
  // за „пауза от човека“.
  const [videoDur, setVideoDur] = useState<number | null>(null);
  const pastVideoEnd = playable && inFilm && videoDur != null && livePos >= videoDur - 0.5;

  // ── поканата: точно с надписите; след филма — винаги (до срока) ──
  const canPayAfterClose = props.depositPaid > 0 || props.invited;
  const offerOpen = inFilm ? isOfferOpen(livePos) : phase === "after" ? true : phase === "closed" ? canPayAfterClose || props.bought : false;
  const offerTracked = useRef(false);
  useEffect(() => {
    if (offerOpen && !offerTracked.current) {
      offerTracked.current = true;
      track("kino_offer_shown", { phase });
    }
  }, [offerOpen, phase]);

  // ── „Твоето число“ (сцена 9.7): полето под филма излиза от numberAtSec ──
  const [hours, setHours] = useState<number | null>(props.hours);
  const numberOpen = (inFilm && (livePos >= FILM.numberAtSec || hours != null)) || phase === "after";

  const beatMode: BeatMode | null = phase === "doors" ? "doors" : inFilm ? "premiere" : phase === "after" ? "offer" : null;
  const posRef = useRef(pos);
  const stateRef = useRef({ beatMode, pos, playing: filmPlaying });
  useEffect(() => {
    posRef.current = pos;
    stateRef.current = { beatMode, pos, playing: filmPlaying };
  });
  const getPos = useCallback(() => posRef.current, []);
  const actions = useOfferActions({ token: preview ? null : token, from: "zala", pos: getPos });

  // ── филмът: плейърът върви по часа ──
  useEffect(() => {
    const p = player.current;
    if (!playable || !p || !inFilm || !armed || userPausedRef.current) return;
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
  }, [now, inFilm, armed, livePos, playable]);

  // ── реакциите, които летят по екрана ──
  const [floats, setFloats] = useState<Float[]>([]);
  const floatId = useRef(0);
  const spawn = useCallback((emoji: string, n = 1) => {
    const items: Float[] = Array.from({ length: Math.min(n, 8) }, () => ({ id: ++floatId.current, emoji, left: 8 + Math.random() * 84 }));
    setFloats((f) => [...f.slice(-24), ...items]);
    window.setTimeout(() => setFloats((f) => f.filter((x) => !items.some((i) => i.id === x.id))), 2700);
  }, []);

  // ── пулсът: вратите, филмът и поканата след него (за „в залата сега“) ──
  const lastBeat = useRef(0);
  const sendBeat = useCallback(
    (viaBeacon = false) => {
      if (!token || preview) return;
      const s = stateRef.current;
      if (!s.beatMode) return;
      const t = Date.now();
      const d = lastBeat.current ? Math.min(20, (t - lastBeat.current) / 1000) : 0;
      lastBeat.current = t;
      const body = {
        k: "beat",
        t: token,
        pos: Math.round(s.pos),
        d: s.playing ? Math.round(d) : 0,
        mode: s.beatMode,
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

  const beating = !!beatMode && !!token && !preview;
  useEffect(() => {
    if (!beating) return;
    const first = window.setTimeout(() => sendBeat(), 1200);
    const id = window.setInterval(() => sendBeat(), BEAT_MS);
    const onVis = () => document.visibilityState === "hidden" && sendBeat(true);
    const onHide = () => sendBeat(true);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
    };
  }, [beating, sendBeat]);

  // Щом човекът влезе във филма — пулс веднага (не след 15 s).
  useEffect(() => {
    if (inFilm && armed) sendBeat();
  }, [inFilm, armed, sendBeat]);

  // ── подаръкът след въпросите ──
  const reachedBonus = inFilm && livePos >= FILM.postCreditsAtSec + 15;
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
        bonusAsked.current = false; // грешка/мрежа — пак след малко
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaultBonus е от конфигурацията
  }, [reachedBonus, bonus.state, token, preview]);
  const bonusOpen = bonus.state === "open" || ((!token || preview) && reachedBonus);
  const bonusData = bonus.data ?? defaultBonus;

  // ── „НА ЖИВО“ от Режисьорската кабина ──
  const live = useKinoLive({
    token: preview ? null : token,
    enabled: phase === "doors" || inFilm || phase === "after",
    preview,
    simUrl: props.simLive,
  });

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
    if (inFilm) {
      p.seek(livePos);
      if (!(await p.play())) {
        p.setMuted(true);
        setMutedBlocked(await p.play());
      }
    } else {
      // вратите: кратко пускане „отключва“ звука за началото (iOS / Chrome)
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

  function onPlayerState(p: boolean) {
    setPlaying(p);
    const dur = player.current?.duration() ?? null;
    const atEnd = dur != null && posRef.current >= dur - 1;
    if (!p && inFilm && armed && !tryingPlay.current && !atEnd) {
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
  }, [chapterIdx, inFilm]);

  const cd = splitCountdown(tl.premiereMs - now);
  const simLinks = ["lobby", "doors", "film", "film:1950", "number", "offer", "qa", "bonus", "after", "last", "closed"];
  const segment = useMemo(() => segmentAt(pos), [pos]);
  const dryNote = preview || process.env.NODE_ENV !== "production";

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
                Прожекцията е {labels.onDay}, в {labels.time} — само веднъж
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
                Залата отваря вратите в {labels.doorsTime}. Записи няма — затова си запази вечерта. Остави таба отворен или се върни по
                линка от билета.
              </p>
            </div>
          </>
        )}

        {/* ── ЕКРАНЪТ: вратите и филмът ── */}
        {(phase === "doors" || inFilm) && (
          <>
            <div className="k-screen">
              {video.kind !== "none" ? (
                <KinoPlayer ref={player} source={video} controls={false} title={KINO.title} onStateChange={onPlayerState} onMeta={setVideoDur} />
              ) : (
                <TitleCard pos={pos} note={dryNote ? "проба без филм" : undefined} />
              )}
              {pastVideoEnd && armed && (
                <div className="k-screen-cover">
                  <TitleCard pos={pos} note={dryNote ? "пробното видео свърши — залата продължава по часа" : undefined} />
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

              {inFilm && !armed && (
                <div className="k-overlay">
                  <div className="k-overlay-inner">
                    <p className="k-overlay-title">Филмът върви от {formatClock(livePos)}</p>
                    <p className="k-muted" style={{ margin: "0 0 14px" }}>
                      Влизаш в текущата минута — като в истинско кино. Прожекцията е само сега.
                    </p>
                    <button type="button" className="k-btn k-btn--primary" onClick={enter}>
                      🔊 Влез в залата
                    </button>
                  </div>
                </div>
              )}
              {inFilm && armed && playable && userPaused && (
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
            </div>

            <LiveJoin live={live} token={preview ? null : token} pos={getPos} />

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

            {inFilm && (
              <>
                <div className="k-progress" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, (pos / FILM.offerAtSec) * 100)}%` }} />
                </div>
                <div className="k-chapters" ref={chapterStrip} aria-label="Главите">
                  {FILM.chapters.map((c, i) => {
                    const done = pos >= FILM.offerAtSec || i < chapterIdx;
                    const nowCh = pos < FILM.offerAtSec && i === chapterIdx;
                    return (
                      <span
                        key={c.n}
                        className={`k-chapter${nowCh ? " k-chapter--now" : done ? " k-chapter--done" : ""}`}
                        data-now={nowCh ? "1" : undefined}
                      >
                        {c.n}. {c.title}
                      </span>
                    );
                  })}
                  {pos >= FILM.qaAtSec && (
                    <span className="k-chapter k-chapter--now" data-now="1">
                      {segment.title}
                    </span>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ── СЛЕД ФИЛМА: само поканата ── */}
        {phase === "after" && (
          <>
            <div className="k-panel k-after">
              <span className="k-kicker">Прожекцията свърши</span>
              <h1 className="k-h2" style={{ marginTop: 8 }}>
                {props.entered ? "Благодаря, че беше в залата" : `„${KINO.title}“ беше ${labels.onDay}`}
              </h1>
              <p className="k-lead" style={{ margin: 0 }}>
                {props.entered
                  ? "Ето поканата от края на филма — трите начина да продължим заедно."
                  : "Филмът беше само веднъж, без запис. Поканата от края му е тук — трите начина да продължим заедно."}{" "}
                Записването в потока е отворено до {cohort.closeDay}, {cohort.closeTime}.
              </p>
            </div>
            <LiveJoin live={live} token={preview ? null : token} pos={getPos} />
          </>
        )}

        {/* ── ЗАПИСВАНЕТО ЗАТВОРИ ── */}
        {phase === "closed" && !offerOpen && (
          <div className="k-panel" style={{ textAlign: "center", padding: "34px 20px" }}>
            <p className="k-kicker" style={{ justifyContent: "center" }}>
              Записването затвори
            </p>
            <h1 className="k-h2">Записването в първия поток затвори</h1>
            <p className="k-lead" style={{ marginInline: "auto" }}>
              Затвори {labels.closeDay}, {labels.closeTime}. Следващият поток започва {cohort.startOnDay} — нека поговорим дали е за
              теб.
            </p>
            <div style={{ textAlign: "left" }}>
              <CallPanel token={preview ? null : token} name={props.name} email={props.email} />
            </div>
          </div>
        )}

        {/* ── РЕАКЦИИТЕ ── */}
        {inFilm && (
          <div className="k-reactions" aria-label="Реакции">
            {REACTIONS.map((r) => (
              <button key={r} type="button" className="k-react" onClick={() => react(r)} aria-label={`Реакция ${r}`}>
                {r}
              </button>
            ))}
            <span className="k-muted" style={{ fontSize: "0.85rem" }}>
              Реакциите на залата летят по екрана.
            </span>
          </div>
        )}

        {/* ── ТВОЕТО ЧИСЛО — полето под филма (след филма — под поканата) ── */}
        {numberOpen && inFilm && <NumberBox token={preview ? null : token} pos={getPos} saved={hours} onSaved={setHours} />}

        {/* ── ПОДАРЪКЪТ ── */}
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
              // ⚠ Подаръкът (KINO_BONUS_URL, само на сървъра) — решение на Ивайло
              <p className="k-muted" style={{ marginTop: 10 }}>
                Подаръкът идва на имейла ти до 24 часа.
              </p>
            )}
          </div>
        )}
        {bonus.state === "more" && (
          <p className="k-muted" style={{ marginTop: 14 }}>
            🎁 Подаръкът в края е за изгледалите филма. Остани в залата до края — и ще те чака тук.
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
            cohort={cohort}
          />
        )}
        {numberOpen && !inFilm && <NumberBox token={preview ? null : token} pos={getPos} saved={hours} onSaved={setHours} />}

        {(inFilm || phase === "after") && (
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
