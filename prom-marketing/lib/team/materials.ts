/**
 * Обучителните материали — кой файл за кого. Файловете живеят в
 * public/materiali/ (PDF + HTML), за да се теглят от телефона без вход в
 * базата. Ролята решава кое излиза първо; всички виждат ценоразписа само ако
 * модулът „Цени“ им е разрешен.
 */
import type { TeamModule, TeamRole } from "./types";

export interface Material {
  id: string;
  title: string;
  about: string;
  file: string;
  /** за кои роли е основен */
  roles: TeamRole[];
  /** ако е зададен — вижда се само с този модул */
  module?: TeamModule;
  minutes: number;
}

export const MATERIALS: Material[] = [
  {
    id: "dimitar-setter",
    title: "Наръчник на сетъра: как уговаряш срещи",
    about: "Денят ти в опашката, пълният скрипт за разговора, какво казваш при всяко възражение, как записваш всеки изход в CRM-а.",
    file: "/materiali/dimitar-setter.pdf",
    roles: ["setter", "owner"],
    minutes: 40,
  },
  {
    id: "ivan-delivery",
    title: "Наръчник по изпълнение: маркетинг и CRM системи",
    about: "Таблото с проектите и задачите, чеклистите по вид услуга, комуникацията с Ивайло и с клиента през CRM-а, стандартите за качество.",
    file: "/materiali/ivan-delivery.pdf",
    roles: ["delivery", "marketing", "owner"],
    minutes: 45,
  },
  {
    id: "prodavach-prezentacia",
    title: "Презентация: продавач в Pro Marketing — от основите до плащането",
    about: "Пълният наръчник като слайдове: какво продаваме и трите пътя за клиента, скриптът с всеки въпрос (защо го задаваш, какъв отговор търсиш, истински или фалшив), лостовете на миналото и времето, прерамкирането, новата идентичност, всички възражения с точните думи, затварянето, follow up, ролевите игри и процесът в CRM-а.",
    file: "/materiali/prodavach-prezentacia.pdf",
    roles: ["sales", "owner"],
    minutes: 150,
  },
  {
    id: "prodavach",
    title: "Наръчник на продавача: от среща до подписан клиент",
    about: "Подготовката, скриптът на разговора по етапи, възраженията, затварянето, какво записваш след срещата и как се плащат комисионните.",
    file: "/materiali/prodavach.pdf",
    roles: ["sales", "owner"],
    minutes: 90,
  },
  {
    id: "mentorska-programa",
    title: "Менторска програма: сам си правиш CRM, AI автоматизации и продаваш такива услуги",
    about: "8-седмичната програма модул по модул + скриптът, с който тя се продава.",
    file: "/materiali/mentorska-programa.pdf",
    roles: ["sales", "owner", "delivery"],
    minutes: 60,
  },
  {
    id: "ceni",
    title: "Ценоразпис за продавачите",
    about: "Всички услуги и нива, какво включва всяко, правилата за цената и как се казва на глас.",
    file: "/materiali/ceni.pdf",
    roles: ["sales", "owner"],
    module: "ceni",
    minutes: 20,
  },
];

export function materialsFor(role: TeamRole, canSeeModule: (m: TeamModule) => boolean): { mine: Material[]; other: Material[] } {
  const allowed = MATERIALS.filter((m) => !m.module || canSeeModule(m.module));
  return {
    mine: allowed.filter((m) => m.roles.includes(role)),
    other: allowed.filter((m) => !m.roles.includes(role)),
  };
}
