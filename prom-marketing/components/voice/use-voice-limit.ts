"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Часовникът на един разговор с гласовия агент.
 *
 * ⚠️ Това е ИСТИНСКОТО спиране на десетте минути, не промптът.
 *
 * ElevenLabs таксува свързаното време, а единственият, който може да затвори
 * линията, е страницата, която я е отворила: говорителят е web component в
 * това дърво и щом го махнем, микрофонът и връзката си отиват заедно с него.
 * Промптът само прави края красив — човек, който помоли агента „говори още",
 * ще получи „говори още", защото това е учтивото нещо.
 *
 * Броенето е по СТЕНЕН ЧАСОВНИК, не по натрупани тикове. Фонов таб получава
 * интервал веднъж в секундата в най-добрия случай и никакъв в най-лошия; с
 * краен момент във времето отброяването е вярно, дори човекът да е бил в
 * друг таб през цялото време.
 */

export interface VoiceLimit {
  /** Колко секунди има ТОЗИ разговор — остатъкът на човека, не таванът. */
  seconds: number;
  /** На коя секунда се показва предупреждението. */
  warn_at: number;
  /** Колко е изговорил преди днешния разговор — за текста „остават ти…". */
  used_seconds?: number;
}

export interface Countdown {
  /** Оставащи секунди, закръглени нагоре. `null` = часовникът не върви. */
  left: number | null;
  /** Минала е `warn_at` — време е агентът да приключва. */
  warning: boolean;
  /** „9:41" — за екрана. */
  label: string;
}

export function useVoiceLimit(
  limit: VoiceLimit | null,
  opts: {
    /**
     * `Date.now()` от мига, в който линията се е отворила — слага го
     * родителят, в самия обработчик на бутона. Нарочно не се ражда тук:
     * начален момент, изчислен в ефект, значи setState в ефект, а оттам
     * идват каскадните рендери, за които React вече ругае на глас.
     */
    startedAt: number | null;
    onExpire: () => void;
  }
): Countdown {
  const { startedAt } = opts;
  const total = limit?.seconds ?? 0;
  const running = Boolean(limit) && startedAt !== null && total > 0;

  // Само пулс. Стойността се смята при рендер от стенния часовник, затова
  // задушен фонов таб бави показването, но не изкривява отброяването.
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running, startedAt]);

  let left: number | null = null;
  if (running && startedAt !== null) {
    const now = Math.max(tick, startedAt);
    left = Math.max(0, Math.ceil((startedAt + total * 1000 - now) / 1000));
  }

  // Функцията от родителя се сменя при всеки рендер; в ref, за да не рестартира
  // ефекта. Присвояването е в ефект, не при рендер.
  const onExpire = useRef(opts.onExpire);
  useEffect(() => {
    onExpire.current = opts.onExpire;
  });

  const done = left === 0;
  useEffect(() => {
    if (done) onExpire.current();
  }, [done]);

  const elapsed = left === null ? 0 : total - left;
  return {
    left,
    warning: left !== null && elapsed >= (limit?.warn_at ?? total),
    label: left === null ? "" : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`,
  };
}

/** Какво пише на екрана, когато времето свърши. Едно място, два компонента. */
export const VOICE_EXPIRED_TITLE = "Дотук бяха десетте минути.";
export const VOICE_EXPIRED_TEXT =
  "Демото е по десет минути на човек, за да стигне за всички — и ти ги използва докрай. " +
  "Данните ти са при нас, а следващата стъпка е по-полезна от още разговор с мен: " +
  "двайсет минути с Ивайло, който ще погледне конкретно твоя случай.";
