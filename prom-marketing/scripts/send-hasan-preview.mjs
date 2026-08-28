#!/usr/bin/env node
// Preview към emmgivailopetev38@gmail.com на имейла за Хасан.

const TOKEN = "d57f2e068ec50e6ebccc5e98dbf9a9189a2fbaa238b22354036250334a57872e";
const HOST = "https://promarketing.pw";

const subject = "AI автоматизации за бизнеса ви — кратко представяне";

const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#0d1221;max-width:600px">
<p>Здравейте Хасан,</p>

<p>Видях, че се интересувате от AI автоматизация и маркетинг — затова ви пиша лично. Аз съм Ивайло Петев, управител на „ПроМаркетинг" ЕООД. Изграждаме AI операционни системи, които поемат рутинните задачи в бизнеса и спестяват часове работа всеки ден.</p>

<p><strong>Какво правим конкретно:</strong></p>
<ul style="padding-left:20px">
  <li><strong>AI CRM системa</strong> — автоматично оценява lead-ове, генерира оферти и договори, проследява клиента до подписан договор</li>
  <li><strong>Content AI Engine</strong> — социални публикации, банери, Reels в брандовия глас, без агенция</li>
  <li><strong>Реклами + дневен анализ</strong> — Meta и Google кампании с автоматични препоръки за оптимизация</li>
  <li><strong>Чат бот контрол</strong> — управлявате цялата система с разговор на български</li>
  <li><strong>Cloud + автоматизация</strong> — собствена инфраструктура, не зависите от външни платформи</li>
</ul>

<p>Цените започват от 2 000 € (без ДДС) за пълно изграждане + 30 дни поддръжка. Сроковете са 30 дни общо.</p>

<p>Ако ви е интересно, мога да ви представя кратка персонализирана презентация спрямо вашия бизнес — отделям ~30 минути.</p>

<p><strong>Свободен сте за разговор?</strong> Резервирайте удобен час: <a href="https://promarketing.pw/booking" style="color:#0066ff">promarketing.pw/booking</a></p>

<p>Или ми отговорете директно на този имейл — ще ви се обадя.</p>

<p>Поздрави,<br/>
<strong>Ивайло Петев</strong><br/>
Управител · „ПроМаркетинг" ЕООД<br/>
+359 877 399 963 · <a href="https://promarketing.pw" style="color:#0066ff">promarketing.pw</a></p>
</div>`;

const text = `Здравейте Хасан,

Видях, че се интересувате от AI автоматизация и маркетинг — затова ви пиша лично. Аз съм Ивайло Петев, управител на „ПроМаркетинг" ЕООД. Изграждаме AI операционни системи, които поемат рутинните задачи в бизнеса.

Какво правим:
- AI CRM — оценка на lead-ове, оферти, договори, проследяване
- Content AI Engine — социални публикации, банери, Reels
- Реклами + дневен анализ на Meta и Google
- Чат бот контрол на системата с разговор на български
- Cloud + автоматизация

Цените започват от 2 000 € (без ДДС) за пълно изграждане + 30 дни поддръжка. Срок: 30 дни.

Резервирайте 30 мин разговор: https://promarketing.pw/booking
Или отговорете на този имейл и ще ви се обадя.

Поздрави,
Ивайло Петев
Управител · „ПроМаркетинг" ЕООД
+359 877 399 963 · promarketing.pw`;

const previewHtml = `<div style="background:#fff3cd;border:1px solid #ffc107;padding:12px;margin-bottom:20px;border-radius:6px;font-family:Arial">
<strong>📧 PREVIEW</strong> — ще иде до <code>xasirosi.eu@gmail.com</code> (Хасан Ерол Хасан) след твоето „да пращай".<br/>
Reply-to: <code>emmgivailopetev38@gmail.com</code>
</div>` + html;

const r = await fetch(`${HOST}/api/email/send`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "emmgivailopetev38@gmail.com",
    subject: "[PREVIEW] " + subject,
    html: previewHtml,
    text: "[PREVIEW]\n\n" + text,
    replyTo: "emmgivailopetev38@gmail.com",
  }),
});
console.log(await r.json());
