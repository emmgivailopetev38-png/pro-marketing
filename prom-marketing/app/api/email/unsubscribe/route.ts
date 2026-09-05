import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";

export const dynamic = "force-dynamic";

/**
 * Отписване от автоматичните имейли.
 *
 * GET показва страница с бутон, POST я изпълнява. Разделени са нарочно:
 * Gmail и Outlook отварят линковете в имейлите предварително, за да ги
 * проверят — ако GET отписваше директно, хората щяха да падат от списъка,
 * без да са пипали нищо.
 *
 * Отписването се записва като АКТИВНОСТ в картона, а не като поле: така се
 * вижда в историята на клиента кога и защо е спряло, а `runWarmSequence` го
 * чете от същото място, откъдето чете всичко останало.
 */

function page(title: string, body: string, form?: { id: string; token: string }): Response {
  const html = `<!doctype html><html lang="bg"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · ProMarketing</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f7f5;
       font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d2320;padding:24px}
  .card{background:#fff;border-radius:14px;padding:34px;max-width:460px;box-shadow:0 4px 24px rgba(13,34,25,.08)}
  h1{font-size:21px;margin:0 0 12px}
  p{line-height:1.65;color:#31413a;margin:0 0 14px}
  button{background:#0b6b4a;color:#fff;border:0;padding:13px 26px;border-radius:7px;
         font-size:15px;font-weight:600;cursor:pointer;font-family:inherit}
  a{color:#0b6b4a}
</style></head><body><div class="card"><h1>${title}</h1>${body}${
    form
      ? `<form method="post"><input type="hidden" name="c" value="${form.id}"><input type="hidden" name="t" value="${form.token}"><button type="submit">Спри писмата</button></form>`
      : ""
  }</div></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("c") ?? "";
  const token = url.searchParams.get("t") ?? "";
  if (!verifyUnsubscribeToken(id, token)) {
    return page("Линкът не е валиден", "<p>Отговори на имейла с думата „стоп“ и спирам писмата на ръка.</p>");
  }
  return page(
    "Да спра ли писмата?",
    `<p>Един клик и повече няма да получаваш автоматични писма от мен.</p>
     <p>Телефонът и имейлът ми остават отворени — ако потрябва нещо, пиши по всяко време.</p>`,
    { id, token }
  );
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const id = String(form?.get("c") ?? "");
  const token = String(form?.get("t") ?? "");
  if (!verifyUnsubscribeToken(id, token)) {
    return NextResponse.json({ error: "invalid_token" }, { status: 403 });
  }

  const supabase = createServiceClient();
  await supabase.from("contact_activities").insert({
    contact_id: id,
    activity_type: "note",
    title: "Отписа се от автоматичните имейли",
    body: "Натисна линка в подписа. Автоматичните поредици спират; ръчните имейли и обажданията не са засегнати.",
    metadata: { email_opt_out: true },
    created_by: "unsubscribe",
  });

  return page(
    "Готово — спрях ги",
    `<p>Повече автоматични писма няма да идват.</p>
     <p>Ако някога ти потрябва нещо, просто ми пиши — ще се радвам да помогна.</p>
     <p style="margin-top:20px;color:#4a5651">Ивайло Петев · Pro Marketing</p>`
  );
}
