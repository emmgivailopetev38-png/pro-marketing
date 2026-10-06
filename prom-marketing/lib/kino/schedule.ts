/**
 * Загряването — КОГА какво тръгва. Чисти функции (без база), за да се тестват.
 *
 * Таблицата от спецификацията (Д = денят на премиерата, 19:30):
 *   веднага          имейл „билетът“ + SMS „Билетът ти е запазен“  ← при записването, не от крона
 *   Д−5 / Д−3        имейл с трейлър 1 / 2
 *   Д−1              имейл „Утре в 19:30“ + трейлър 3
 *   Д, 12:00         SMS „Днес в 19:30“
 *   Д, 19:15         имейл + SMS с линка към залата
 *   +30 мин          имейл „Филмът върви — влез сега“ — само на невлезлите
 *   след края        имейл „поканата + срокът“ — без купилите (повторение НЯМА)
 *   последните 3 ч   имейл „Записването затваря в полунощ“ + SMS — без купилите
 * Viber („Кино клуб“) и обажданията на Димитър са ръчни — графикът им е в /admin/kino.
 *
 * Всяка стъпка има прозорец [отваря, затваря]: късно записалият се не получава
 * стари напомняния, а ако кронът пропусне завъртане, стъпката тръгва на
 * следващото, докато прозорецът е отворен. Същото като Webinar Flow.
 */
import type { KinoTimeline } from "./time";

export type FlowChannel = "email" | "sms";
export type FlowAudience = "all" | "notEntered" | "notBought";

export interface FlowStage {
  id: string;
  label: string;
  opensMs: number;
  closesMs: number;
  channels: FlowChannel[];
  audience: FlowAudience;
}

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

/**
 * „В 11:00 на ден −5“ = началото на премиерата − 5 дни − (19:30 − 11:00).
 * Пресмята се от часа на премиерата по софийско време, така че смяна на
 * датата в конфигурацията мести целия график сам.
 */
function atDayTime(tl: KinoTimeline, premiereHour: number, premiereMinute: number, dayOffset: number, hour: number, minute = 0): number {
  const diffMin = premiereHour * 60 + premiereMinute - (hour * 60 + minute);
  return tl.premiereMs + dayOffset * DAY - diffMin * MIN;
}

export function buildFlowStages(tl: KinoTimeline, premiereTime: { hour: number; minute: number }): FlowStage[] {
  const { hour: H, minute: M } = premiereTime;
  return [
    {
      id: "trailer1",
      label: "Д−5 · трейлър 1 „Възможността“",
      opensMs: atDayTime(tl, H, M, -5, 11),
      closesMs: atDayTime(tl, H, M, -4, 11),
      channels: ["email"],
      audience: "all",
    },
    {
      id: "trailer2",
      label: "Д−3 · трейлър 2 „Как изглежда, когато го имаш“",
      opensMs: atDayTime(tl, H, M, -3, 11),
      closesMs: atDayTime(tl, H, M, -2, 11),
      channels: ["email"],
      audience: "all",
    },
    {
      id: "tomorrow",
      label: "Д−1 · „Утре в 19:30“ + трейлър 3",
      opensMs: atDayTime(tl, H, M, -1, 11),
      closesMs: atDayTime(tl, H, M, 0, 9),
      channels: ["email"],
      audience: "all",
    },
    {
      id: "today",
      label: "Д · 12:00 · SMS „Днес в 19:30“",
      opensMs: atDayTime(tl, H, M, 0, 12),
      closesMs: atDayTime(tl, H, M, 0, 16),
      channels: ["sms"],
      audience: "all",
    },
    {
      id: "doors",
      label: "Д · 19:15 · линкът към залата",
      opensMs: tl.premiereMs - 15 * MIN,
      closesMs: tl.premiereMs + 10 * MIN,
      channels: ["email", "sms"],
      audience: "all",
    },
    {
      id: "missing",
      label: "+30 мин · „Пропускаш най-важното“",
      opensMs: tl.premiereMs + 30 * MIN,
      closesMs: tl.premiereMs + 50 * MIN,
      channels: ["email"],
      audience: "notEntered",
    },
    {
      id: "after",
      label: "След края · поканата и срокът",
      opensMs: tl.filmEndMs + 5 * MIN,
      closesMs: tl.filmEndMs + 16 * 60 * MIN,
      channels: ["email"],
      audience: "notBought",
    },
    {
      id: "last3h",
      label: "Последните 3 часа · „Записването затваря в полунощ“",
      opensMs: tl.closeMs - 3 * 60 * MIN,
      closesMs: tl.closeMs - 30 * MIN,
      channels: ["email", "sms"],
      audience: "notBought",
    },
  ];
}

export function activeStages(stages: readonly FlowStage[], nowMs: number): FlowStage[] {
  return stages.filter((s) => nowMs >= s.opensMs && nowMs <= s.closesMs);
}

/** Дали човекът е за тази стъпка според аудиторията ѝ. */
export function inAudience(audience: FlowAudience, person: { entered: boolean; bought: boolean }): boolean {
  if (audience === "notEntered") return !person.entered && !person.bought;
  if (audience === "notBought") return !person.bought;
  return true;
}

/**
 * Текстовете на SMS-ите — кратки (кирилицата е 70 знака на SMS), с личния
 * къс линк. `short` е „promarketing.pw/k/…“ без https://, за да пести знаци;
 * `when` — „вт 10.11“ и „19:30“ от конфигурацията.
 */
export function smsText(stageId: string, short: string, when: { day: string; time: string }): string | null {
  switch (stageId) {
    case "ticket":
      return `Билетът ти за ВЪЛНАТА е запазен: ${when.day}, ${when.time}. ${short}`;
    case "today":
      return `Днес в ${when.time} е ВЪЛНАТА — само веднъж. Залата: ${short}`;
    case "doors":
      return `След 15 минути гасим светлините. Влез: ${short}`;
    case "last3h":
      return `Последни 3 часа: записването в потока затваря в полунощ. ${short}`;
    default:
      return null;
  }
}
