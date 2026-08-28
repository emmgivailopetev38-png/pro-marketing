#!/usr/bin/env node
// Preview към emmgivailopetev38@gmail.com на имейла за Теодор Лозев.

const TOKEN = "d57f2e068ec50e6ebccc5e98dbf9a9189a2fbaa238b22354036250334a57872e";
const HOST = "https://promarketing.pw";

const subject = "AI операционна система за строителния ви бизнес — персонална презентация";

const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#0d1221;max-width:600px">
<p>Здравейте Теодор,</p>

<p>Опитах да ви се обадя — не успях да ви хвана. Затова ви пиша лично, както помолихте.</p>

<p>Аз съм Ивайло Петев, управител на <strong>„ПроМаркетинг" ЕООД</strong>. Изграждаме AI операционни системи по поръчка — не продаваме готов SaaS. Системата се прави около конкретните процеси на бизнеса, не наопаки.</p>

<p>Подготвих ви <strong>персонална презентация</strong> с това какво конкретно можем да изградим за строителен бранш:</p>

<p style="text-align:center;margin:28px 0">
  <a href="https://promarketing.pw/oferta/teodor" style="display:inline-block;background:#ffb800;color:#070a0f;padding:14px 28px;border-radius:24px;text-decoration:none;font-weight:bold;letter-spacing:1px">Виж презентацията →</a>
</p>

<p><strong>Накратко — какво ще има в един единен dashboard:</strong></p>
<ul style="padding-left:20px">
  <li><strong>Обекти live</strong> — активни строителни обекти, изпълнение, печалба/разход по проект</li>
  <li><strong>Склад с AI</strong> — снимай фактура, AI чете количества и цени, влиза в склада автоматично</li>
  <li><strong>КСС цифрово</strong> — качване от Excel, маркиране на завършените позиции, авто-генериране на актове</li>
  <li><strong>Счетоводство</strong> — фактури разпознати и разпределени по обект, export към Microinvest / Бизнес навигатор</li>
  <li><strong>AI Sales</strong> — от запитване (Facebook, имейл, телефон) до подписан договор, без губене на клиенти</li>
  <li><strong>Чат бот на български</strong> — управлявате системата с разговор: „Колко струваме на обект Витоша 24 досега?"</li>
</ul>

<p><strong>Как работим</strong> — 30 мин разговор за процесите ви, после демо с примерни данни от строителния бранш, после изграждане за 30 дни, инсталация на място (1-3 дни), 30 дни безплатна поддръжка.</p>

<p><strong>Кога ви е удобен 30-минутен разговор?</strong> Резервирайте директно от презентацията, или ми отговорете на този имейл с удобни часове — ще ви се обадя.</p>

<p>Поздрави,<br/>
<strong>Ивайло Петев</strong><br/>
Управител · „ПроМаркетинг" ЕООД<br/>
+359 877 399 963 · <a href="https://promarketing.pw" style="color:#0066ff">promarketing.pw</a></p>
</div>`;

const text = `Здравейте Теодор,

Опитах да ви се обадя — не успях да ви хвана. Затова ви пиша лично, както помолихте.

Аз съм Ивайло Петев от „ПроМаркетинг" ЕООД. Изграждаме AI операционни системи по поръчка — системата се прави около конкретните процеси на бизнеса.

Подготвих ви персонална презентация:
https://promarketing.pw/oferta/teodor

Какво ще има в един единен dashboard:
- Обекти live — активни строителни обекти, изпълнение, печалба/разход по проект
- Склад с AI — снимка на фактура → автоматично в склада
- КСС цифрово — от Excel, маркиране на завършени позиции, генериране на актове
- Счетоводство — фактури разпределени по обект, export към Microinvest
- AI Sales — от запитване до подписан договор
- Чат бот на български — „Колко струваме на обект Витоша 24 досега?"

Как работим: 30 мин разговор → демо → изграждане за 30 дни → инсталация на място 1-3 дни → 30 дни безплатна поддръжка.

Кога ви е удобен 30-мин разговор? Резервирайте от презентацията или ми отговорете тук.

Поздрави,
Ивайло Петев
Управител · „ПроМаркетинг" ЕООД
+359 877 399 963 · promarketing.pw`;

const previewHtml = `<div style="background:#fff3cd;border:1px solid #ffc107;padding:12px;margin-bottom:20px;border-radius:6px;font-family:Arial">
<strong>📧 PREVIEW</strong> — ще иде до <code>Lozevteodor@gmail.com</code> (Теодор Лозев, Строителство) след твоето „да пращай".<br/>
Reply-to: <code>emmgivailopetev38@gmail.com</code> · Презентация: <a href="https://promarketing.pw/oferta/teodor">promarketing.pw/oferta/teodor</a>
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
