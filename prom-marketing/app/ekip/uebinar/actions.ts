"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTeamActor } from "@/lib/team/session";
import { NA_ZHIVO } from "@/lib/uebinar/na-zhivo";
import { sinhroniziraiPrisastvie, zadaiChasNaOfertata } from "@/lib/uebinar/prisastvie";

/** Часа на офертата и обновяването ги пипат само собственикът и мениджърите. */
async function smeeLi(): Promise<boolean> {
  const actor = await getTeamActor();
  if (!actor) return false;
  return actor.kind === "owner" || actor.member.role === "manager";
}

function natam(msg: string): never {
  revalidatePath("/ekip/uebinar");
  revalidatePath("/ekip");
  redirect(`/ekip/uebinar?msg=${encodeURIComponent(msg)}#upravlenie`);
}

/** „🎯 Офертата започва сега“ — натиска се на живо, когато почне продажбата. */
export async function ofertaSegaAction(): Promise<void> {
  if (!(await smeeLi())) natam("Само Ивайло и мениджърите могат да отбележат офертата.");
  const r = await zadaiChasNaOfertata(null);
  natam(r.ok ? "🎯 Отбелязано: офертата започна сега." : `⚠️ Notifier не прие часа: ${r.error ?? "грешка"}`);
}

/** Часът на офертата след уебинара — „20:35“ в деня на уебинара, по софийско време. */
export async function ofertaChasAction(fd: FormData): Promise<void> {
  if (!(await smeeLi())) natam("Само Ивайло и мениджърите могат да сменят часа на офертата.");
  const raw = String(fd.get("chas") ?? "").trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) natam("⚠️ Часът трябва да е като 20:35.");
  const den = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date(NA_ZHIVO.dateISO));
  // Зимно време в България = +02:00 (уебинарите са от ноември до март; лятото е +03:00).
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Sofia", timeZoneName: "shortOffset" })
    .formatToParts(new Date(NA_ZHIVO.dateISO))
    .find((p) => p.type === "timeZoneName")
    ?.value.replace("GMT", "");
  const off = offset && /^[+-]\d{1,2}$/.test(offset) ? `${offset[0]}${offset.slice(1).padStart(2, "0")}:00` : "+02:00";
  const iso = new Date(`${den}T${m![1].padStart(2, "0")}:${m![2]}:00${off}`).toISOString();
  const r = await zadaiChasNaOfertata(iso);
  natam(r.ok ? `✅ Часът на офертата е ${raw}. Групите са преизчислени.` : `⚠️ Notifier не прие часа: ${r.error ?? "грешка"}`);
}

/** „🔄 Обнови сега“ — тегли от Notifier веднага, без да чака крона. */
export async function obnoviAction(): Promise<void> {
  if (!(await smeeLi())) natam("Само Ивайло и мениджърите могат да обновяват ръчно.");
  const r = await sinhroniziraiPrisastvie({ sila: true });
  natam(
    r.ok
      ? `🔄 Обновено: ${r.redove ?? 0} записани${r.segmenti ? ` · до офертата ${r.segmenti.oferta} · рано ${r.segmenti.rano} · не дойдоха ${r.segmenti.ne_doshal} · с час ${r.segmenti.zapisal}` : ""}.`
      : `⚠️ ${r.prichina ?? "не стана"}`
  );
}
