#!/usr/bin/env node
// One-off: изпрати preview към emmgivailopetev38@gmail.com с обновените PDF-и
// (юристки корекции v2) преди реално изпращане към Станислава.

const TOKEN = "d57f2e068ec50e6ebccc5e98dbf9a9189a2fbaa238b22354036250334a57872e";
const HOST = "https://promarketing.pw";

async function dl(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed ${url}: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  return buf.toString("base64");
}

const offerB64 = await dl(`${HOST}/api/oferta/evolto/pdf?v=${Date.now()}`);
const contractB64 = await dl(`${HOST}/api/oferta/evolto/contract?v=${Date.now()}`);

const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0d1221;max-width:600px">
<p><strong>PREVIEW — ще иде до stanislavamihaylova@abv.bg след твоето „да"</strong></p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0"/>

<p>Здравей Станислава,</p>

<p>Благодаря за прегледа и за конкретните бележки! Нанесох всичко според коментарите ти:</p>

<p><strong>В офертата:</strong></p>
<ul>
  <li>„саппорт" → „поддръжка"</li>
  <li>„прогнозират на разговор" → „уточняват при провеждане на разговор"</li>
  <li>Добавена валидност: 21 дни, считано от датата на изпращането й</li>
</ul>

<p><strong>В договора:</strong></p>
<ul>
  <li>Разширих чл. 5 (Задължения на Възложителя) — 6 ясни точки</li>
  <li>Добавих изцяло нов <strong>чл. 6 — Задължения на Изпълнителя</strong> (7 задължения)</li>
  <li>Добавих нов <strong>чл. 9 — Неустойки при неспазване на клаузите</strong> — 0,5%/ден забава с таван 10%, плюс 10% за нарушение на чл. 5/6</li>
  <li>Реномерирах останалите членове (7-14)</li>
</ul>

<p>Прикачам коригираните PDF-и за финален преглед. Ако имаш още корекции — пиши директно в имейла или ми прати Word файл, както ти е по-удобно.</p>

<p>Поздрави,<br/>
Ивайло Петев<br/>
„ПроМаркетинг" ЕООД<br/>
+359 877 399 963</p>
</div>`;

const text = `Здравей Станислава,

Благодаря за прегледа. Нанесох всички корекции:

ОФЕРТА:
- „саппорт" → „поддръжка"
- „прогнозират на разговор" → „уточняват при провеждане на разговор"
- Добавена валидност: 21 дни, считано от датата на изпращането й

ДОГОВОР:
- Разширен чл. 5 (Задължения на Възложителя)
- Нов чл. 6 — Задължения на Изпълнителя
- Нов чл. 9 — Неустойки при неспазване на клаузите
- Реномерирани останалите членове 7-14

Прикачам коригираните PDF-и.

Поздрави,
Ивайло Петев
„ПроМаркетинг" ЕООД
+359 877 399 963`;

const r = await fetch(`${HOST}/api/email/send`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    to: "emmgivailopetev38@gmail.com",
    subject: "[PREVIEW] Корекции по договор + оферта Evolto — v2 (юрист)",
    html,
    text,
    attachments: [
      { filename: "Evolto-Oferta-v2.pdf", content: offerB64, contentType: "application/pdf" },
      { filename: "Evolto-Dogovor-v2.pdf", content: contractB64, contentType: "application/pdf" },
    ],
  }),
});
const out = await r.json();
console.log(JSON.stringify(out, null, 2));
