#!/usr/bin/env node
// Preview към emmgivailopetev38@gmail.com — показва списъка получатели + шаблона.

const TOKEN = "d57f2e068ec50e6ebccc5e98dbf9a9189a2fbaa238b22354036250334a57872e";
const HOST = "https://promarketing.pw";

const RECIPIENTS = [
  { email: "g.pasev@p-group.eu", name: "Gorcho Pasev", greeting: "Здравейте Gorcho" },
  { email: "pgoranov2233@gmail.com", name: "Петър Горанов", greeting: "Здравейте Петър" },
  { email: "plamen@plasico.com", name: "Пламен Драгнев", greeting: "Здравейте Пламен" },
  { email: "atanasov@atanasovclima.bg", name: "Emil Atanasov", greeting: "Здравейте Емил" },
  { email: "office@goldenkeybg.com", name: "Rosen Kostadinov", greeting: "Здравейте Росен" },
  { email: "sokolovmomcil9@gmail.com", name: "Момчил Соколов", greeting: "Здравейте Момчил" },
  { email: "filmi2filmi22@gmail.com", name: "DM", greeting: "Здравейте" },
  { email: "mchelestinov@gmail.com", name: "Miroslav Chelestinov", greeting: "Здравейте Мирослав" },
];

function buildHtml(greeting) {
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#0d1221;max-width:600px">
<p>${greeting},</p>

<p>Видях, че се интересувате от AI автоматизация — затова ви пиша лично. Аз съм Ивайло Петев, управител на <strong>„ПроМаркетинг" ЕООД</strong>. Изграждаме AI операционни системи по поръчка — спестяват часове ръчна работа всеки ден.</p>

<p><strong>Какво правим конкретно:</strong></p>
<ul style="padding-left:20px">
  <li><strong>AI CRM системa</strong> — автоматично оценява lead-ове, генерира оферти и договори, проследява клиента до подписан договор</li>
  <li><strong>Content AI Engine</strong> — социални публикации, банери, Reels в брандовия глас, без агенция</li>
  <li><strong>Реклами + дневен анализ</strong> — Meta и Google кампании с автоматични препоръки</li>
  <li><strong>Чат бот контрол на български</strong> — управлявате системата с разговор</li>
  <li><strong>Cloud + автоматизация</strong> — собствена инфраструктура, не зависите от външни платформи</li>
</ul>

<p>Цените започват от <strong>500 € (без ДДС)</strong> — спрямо обхвата. Срокът за изграждане е <strong>от 30 до 60 дни според големината на проекта</strong>, плюс 30 дни безплатна поддръжка.</p>

<p>Правя персонализирано решение по вашите процеси — не продавам готов SaaS.</p>

<p><strong>Свободни ли сте за 30-минутен разговор?</strong> Резервирайте удобен час: <a href="https://promarketing.pw/booking" style="color:#0066ff">promarketing.pw/booking</a></p>

<p>Или ми отговорете директно на този имейл — ще ви се обадя.</p>

<p>Поздрави,<br/>
<strong>Ивайло Петев</strong><br/>
Управител · „ПроМаркетинг" ЕООД<br/>
+359 877 399 963 · <a href="https://promarketing.pw" style="color:#0066ff">promarketing.pw</a></p>
</div>`;
}

// Build preview that shows the full plan
const list = RECIPIENTS.map((r, i) => `<li><strong>${i + 1}.</strong> ${r.name} — <code>${r.email}</code><br/><span style="color:#666;font-size:12px">Обръщение: „${r.greeting}"</span></li>`).join("");

const previewHtml = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0d1221;max-width:700px">
<div style="background:#fff3cd;border:1px solid #ffc107;padding:14px;margin-bottom:24px;border-radius:6px">
<strong>📧 BATCH PREVIEW</strong> — ще се изпрати към <strong>${RECIPIENTS.length} получатели</strong> от Meta lead таблиците (24-25 май, които още не са получавали имейл от нас).<br/>
Reply-to: <code>emmgivailopetev38@gmail.com</code> на всички.<br/>
Цени: <strong>от 500 €</strong> · Срок: <strong>30-60 дни според проекта</strong>
</div>

<h2 style="font-size:18px">Списък получатели:</h2>
<ol style="padding-left:20px">${list}</ol>

<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>

<h2 style="font-size:18px">Шаблон на имейла (с пример „Здравейте Петър"):</h2>

${buildHtml("Здравейте Петър")}

<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>

<p style="background:#e7f5e7;padding:12px;border-radius:6px"><strong>Кажи „да пращай" — пускам и 8-те имейла един след друг.</strong></p>
</div>`;

const r = await fetch(`${HOST}/api/email/send`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "emmgivailopetev38@gmail.com",
    subject: `[BATCH PREVIEW] ${RECIPIENTS.length} имейла към Meta лидове (24-25 май)`,
    html: previewHtml,
    text: `BATCH PREVIEW — ${RECIPIENTS.length} получатели:\n\n${RECIPIENTS.map((r, i) => `${i + 1}. ${r.name} — ${r.email}`).join("\n")}\n\nКажи „да пращай" за всички.`,
    replyTo: "emmgivailopetev38@gmail.com",
  }),
});
console.log(await r.json());
