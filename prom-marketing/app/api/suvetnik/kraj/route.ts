import { NextResponse } from "next/server";
import { z } from "zod";
import { suvetnikAuthorized } from "@/lib/suvetnik/http";
import { cyal, DALBOK_MODEL, GeminiGreshka, geminiKlyuch } from "@/lib/suvetnik/gemini";
import { razgovorTekst } from "@/lib/suvetnik/zayavka";
import { createServiceClient } from "@/lib/supabase/service";
import { recordActivity } from "@/lib/crm/repository";
import type { Obobshtenie, Replika } from "@/lib/suvetnik/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  sesia: z.string().uuid().optional(),
  zapochna: z.string().max(40),
  rejim: z.enum(["online", "mikrofon"]),
  brif: z.record(z.string(), z.unknown()),
  sastoyanie: z.record(z.string(), z.unknown()),
  replikI: z.array(z.object({ id: z.string(), s: z.enum(["I", "K", "?"]), t: z.string().max(4000), at: z.number() })).max(3000),
  podskazki: z.array(z.record(z.string(), z.unknown())).max(600),
  obobshti: z.boolean().default(true),
  crm: z.object({
    kontakt_id: z.string().uuid(),
    vid: z.enum(["meeting", "call"]).default("meeting"),
    sledvashto: z.string().max(40).optional(),
    belezhka: z.string().max(4000).optional(),
  }).optional(),
});

const SISTEMA = `Ти си Георги Асенов (МВП — Майстор в продажбите) и анализираш продажбения разговор на Ивайло Петев (Pro Marketing, AI автоматизации) с клиент. Пишеш на български, директно, без омекотяване, но топло.
Върни САМО JSON с полетата:
{"rezyume": "3–4 изречения: какво стана",
 "bolki": ["болките на клиента с НЕГОВИТЕ думи и числа"],
 "cel": "какво иска клиентът, с неговите думи",
 "vazrazheniya": [{"tip": "думите му", "obrano": true/false, "kak": "как беше обрано или какво трябваше"}],
 "prevencia_propusnata": ["кое не беше обрано предварително: кой решава / бюджет / какво го е спирало / защо сега / критерий / лош опит"],
 "sledvashta_stapka": "уговорената следваща стъпка или „няма — грешка“",
 "data_chas": "уговореният ден и час или „не е уговорен“",
 "samoanaliz": {"po_barzo_do_problema": "Можеше ли по-бързо да стигне до истинския проблем — как", "zadalbochavane": "Можеше ли да задълбае повече — къде", "predotvratyavane": "Можеше ли да предотврати възражението — как"},
 "silni": ["2–3 неща, които направи добре"],
 "za_trenirovka": ["2–3 конкретни неща за тренировка, с точната реплика на Георги, която трябваше да каже"],
 "crm_belezhka": "5–6 изречения за картона в CRM: какво каза клиентът, какво е обещано, какво остава"}
Не измисляй нищо, което го няма в разговора.`;

/**
 * POST /api/suvetnik/kraj — краят на разговора: разбор по трите въпроса на Георги,
 * запис в suvetnik_sesii и (ако е избран контакт) активност в картона му в CRM-а.
 */
export async function POST(request: Request) {
  if (!(await suvetnikAuthorized())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидна заявка." }, { status: 400 });
  const d = parsed.data;
  const replikI = d.replikI as Replika[];

  let obobshtenie: Obobshtenie | null = null;
  let greshka: string | null = null;
  if (d.obobshti && replikI.length >= 4) {
    if (!geminiKlyuch()) greshka = "Липсва GEMINI_API_KEY — разборът не е направен.";
    else {
      try {
        const brif = JSON.stringify(d.brif);
        const tekst = await cyal({
          system: SISTEMA,
          user: `БРИФ: ${brif}\n\nРАЗГОВОРЪТ (И = Ивайло, К = клиентът):\n${razgovorTekst(replikI, 60000)}`,
          model: DALBOK_MODEL,
          mislene: "low",
          maxTokens: 4000,
          json: true,
        });
        obobshtenie = JSON.parse(tekst.replace(/^```(?:json)?|```$/g, "").trim()) as Obobshtenie;
      } catch (error) {
        console.error("[suvetnik/kraj] разбор", error);
        greshka = error instanceof GeminiGreshka ? error.message : "Разборът не излезе — транскриптът е запазен.";
      }
    }
  }

  const sb = createServiceClient();
  const zapis = d.sesia
    // втори път (записът в CRM-а) — пипа само картона, разборът остава
    ? await sb.from("suvetnik_sesii").update({ kontakt_id: d.crm?.kontakt_id ?? null }).eq("id", d.sesia).select("id,obobshtenie").single()
    : await sb.from("suvetnik_sesii").insert({
      zapochna: d.zapochna,
      priklyuchi: new Date().toISOString(),
      rejim: d.rejim,
      klient: typeof d.brif.klient === "string" ? d.brif.klient : null,
      brif: d.brif,
      sastoyanie: d.sastoyanie,
      transcript: replikI,
      podskazki: d.podskazki,
      obobshtenie,
      kontakt_id: d.crm?.kontakt_id ?? null,
    }).select("id,obobshtenie").single();
  if (!obobshtenie && zapis.data?.obobshtenie) obobshtenie = zapis.data.obobshtenie as Obobshtenie;
  if (zapis.error) console.error("[suvetnik/kraj] запис", zapis.error.message);

  let crm: { activity_id: string | null; error: string | null } | null = null;
  if (d.crm) {
    const belezhka = d.crm.belezhka?.trim() || obobshtenie?.crm_belezhka || "";
    const tyalo = [
      belezhka,
      obobshtenie?.sledvashta_stapka ? `Следваща стъпка: ${obobshtenie.sledvashta_stapka}${obobshtenie.data_chas ? ` (${obobshtenie.data_chas})` : ""}` : "",
      obobshtenie?.vazrazheniya?.length ? `Възражения: ${obobshtenie.vazrazheniya.map((v) => `${v.tip}${v.obrano ? " ✓" : " ✗"}`).join("; ")}` : "",
    ].filter(Boolean).join("\n\n");
    const r = await recordActivity({
      contact_id: d.crm.kontakt_id,
      activity_type: d.crm.vid,
      title: `${d.crm.vid === "call" ? "Разговор" : "Среща"} · Съветникът на живо`,
      body: tyalo || "Разговор със съветника (без разбор).",
      occurred_at: d.zapochna,
      created_by: "suvetnik",
      metadata: { suvetnik_sesia: zapis.data?.id ?? null },
      dedupe_key: zapis.data?.id ? `suvetnik:${zapis.data.id}` : undefined,
      mark_heard: true,
      ...(d.crm.sledvashto ? { next_followup_at: new Date(d.crm.sledvashto).toISOString() } : {}),
    });
    crm = { activity_id: r.activity_id, error: r.error };
  }

  return NextResponse.json({ id: zapis.data?.id ?? null, obobshtenie, greshka, crm, zapisGreshka: zapis.error?.message ?? null });
}
