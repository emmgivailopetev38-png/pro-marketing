/**
 * Технически преглед на favo-shop.com и favo-decor.com за Любо Флорев.
 *
 * Всяко число тук е измерено на живо на 03.09.2026, не е преценено на око:
 * теглото идва от Resource Timing, пикселните събития — от реалните повиквания
 * към facebook.com/tr, версиите — от meta generator, а празният sitemap и
 * липсващият robots.txt са проверени с fetch. Ако нещо се оправи от тяхна
 * страна, страницата спира да е вярна — затова датата стои най-отгоре.
 *
 * ⚠️ Пикселът РАБОТИ и това е нарочно първата секция. Първоначалната преценка
 * беше обратната и се оказа грешна; проверката по мрежовите заявки я обърна.
 *
 * Палитрата е от материала им — бреза, изгоряло дърво, синьото от логото.
 * Страницата е нарочно само светла: живее вътре в сайта и не бива да
 * се бори с неговите глобални стилове.
 */

const CSS = `
.favo-doc{
  --ground:#FBFAF6; --panel:#F2EFE5; --surface:#FFFFFF;
  --ink:#221A12; --ink-2:#6C5F50; --ink-3:#988C7B;
  --rule:#E3DDCD; --rule-soft:#EFEADC;
  --accent:#2C55B0; --accent-soft:#E9EEFA;
  --burn:#B87309; --burn-soft:#FAF0DD;
  --crit:#9B1D1D; --crit-soft:#FAE8E5;
  --shadow:0 1px 2px rgba(34,26,18,.05), 0 8px 24px -16px rgba(34,26,18,.22);
  background:var(--ground); color:var(--ink);
  font-family:var(--favo-body),Georgia,serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.favo-doc *{box-sizing:border-box}
.favo-doc .wrap{max-width:1180px;margin:0 auto;padding:0 24px 96px}
.favo-doc h1,.favo-doc h2,.favo-doc h3{font-family:var(--favo-ui),Arial,sans-serif}
.favo-doc .mono{font-family:var(--favo-mono),monospace;font-variant-numeric:tabular-nums}

.favo-doc .masthead{padding:72px 0 40px;border-bottom:2px solid var(--ink)}
.favo-doc .eyebrow{font-family:var(--favo-mono),monospace;font-size:12px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--ink-2);margin:0 0 22px}
.favo-doc h1{font-size:clamp(38px,6.4vw,68px);line-height:1.02;font-weight:700;
  letter-spacing:-.025em;margin:0 0 20px;text-wrap:balance}
.favo-doc .deck{font-size:clamp(18px,2.1vw,21px);line-height:1.55;color:var(--ink-2);
  max-width:60ch;margin:0 0 34px}
.favo-doc .byline{display:flex;flex-wrap:wrap;gap:8px 30px;
  font-family:var(--favo-ui),sans-serif;font-size:13.5px;color:var(--ink-2)}
.favo-doc .byline b{color:var(--ink);font-weight:600}
.favo-doc .byline .pdf{font-weight:600;color:var(--accent);text-decoration:none;
  border:1px solid var(--accent);padding:5px 12px;border-radius:4px;transition:background .15s ease}
.favo-doc .byline .pdf:hover{background:var(--accent-soft)}
@media print{.favo-doc .byline .pdf{display:none}}

.favo-doc .cols{display:grid;grid-template-columns:minmax(0,1fr) 358px;gap:60px;
  align-items:start;padding-top:52px}
@media (max-width:1000px){.favo-doc .cols{grid-template-columns:1fr;gap:44px}}

.favo-doc section{margin:0 0 58px}
.favo-doc h2{font-size:13px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;
  color:var(--ink-2);margin:0 0 6px;font-family:var(--favo-mono),monospace}
.favo-doc .h2sub{font-family:var(--favo-ui),sans-serif;font-size:clamp(25px,3.3vw,32px);
  font-weight:600;letter-spacing:-.02em;line-height:1.2;margin:0 0 26px;color:var(--ink);
  text-wrap:balance}
.favo-doc p{margin:0 0 17px;max-width:66ch}
.favo-doc .lead{font-size:18.5px}
.favo-doc a{color:var(--accent);text-underline-offset:3px}
.favo-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}

.favo-doc .finding{display:grid;grid-template-columns:auto minmax(0,1fr);gap:0 18px;
  padding:20px 0;border-top:1px solid var(--rule-soft)}
.favo-doc .finding:first-of-type{border-top:1px solid var(--rule)}
.favo-doc .chip{grid-row:1/3;align-self:start;margin-top:5px;
  font-family:var(--favo-mono),monospace;font-size:10.5px;letter-spacing:.09em;
  text-transform:uppercase;padding:4px 9px;border-radius:3px;white-space:nowrap;
  border:1px solid;font-weight:500}
.favo-doc .chip.crit{color:var(--crit);background:var(--crit-soft);border-color:var(--crit)}
.favo-doc .chip.warn{color:var(--burn);background:var(--burn-soft);border-color:var(--burn)}
.favo-doc .chip.ok{color:var(--accent);background:var(--accent-soft);border-color:var(--accent)}
.favo-doc .finding h3{font-size:19px;font-weight:600;line-height:1.32;margin:0 0 7px;
  letter-spacing:-.012em;color:var(--ink)}
.favo-doc .finding p{margin:0;font-size:16px;line-height:1.58;color:var(--ink-2);max-width:62ch}
.favo-doc .finding p + p{margin-top:9px}
.favo-doc .finding code{font-family:var(--favo-mono),monospace;font-size:13px;
  background:var(--panel);padding:1.5px 5px;border-radius:3px;color:var(--ink);word-break:break-all}
@media (max-width:560px){
  .favo-doc .finding{grid-template-columns:1fr;gap:9px}
  .favo-doc .chip{grid-row:auto;justify-self:start;margin-top:0}
}

.favo-doc .shopbar{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 16px;
  margin:0 0 4px;padding-top:6px}
.favo-doc .shopbar .name{font-family:var(--favo-mono),monospace;font-size:19px;
  font-weight:500;letter-spacing:-.02em;color:var(--ink)}
.favo-doc .shopbar .role{font-family:var(--favo-ui),sans-serif;font-size:13px;color:var(--ink-2)}
.favo-doc .stackline{font-family:var(--favo-mono),monospace;font-size:12.5px;
  color:var(--ink-3);margin:0 0 20px}

.favo-doc figure{margin:30px 0 26px;padding:26px 26px 22px;background:var(--surface);
  border:1px solid var(--rule);border-radius:5px;box-shadow:var(--shadow)}
.favo-doc figcaption{font-family:var(--favo-ui),sans-serif;font-size:13.5px;color:var(--ink-2);
  margin-top:20px;padding-top:16px;border-top:1px solid var(--rule-soft);max-width:58ch}
.favo-doc .bars{display:flex;flex-direction:column;gap:17px}
.favo-doc .bar-row{display:grid;grid-template-columns:150px minmax(0,1fr);gap:16px;align-items:center}
.favo-doc .bar-label{font-family:var(--favo-mono),monospace;font-size:13px;color:var(--ink-2);
  text-align:right;line-height:1.3}
.favo-doc .bar-track{display:flex;align-items:center;gap:11px;min-width:0}
.favo-doc .bar{height:26px;border-radius:0 4px 4px 0;flex:none;transition:filter .18s ease}
.favo-doc .bar-row:hover .bar{filter:brightness(1.08)}
.favo-doc .bar.is-crit{background:var(--crit)}
.favo-doc .bar.is-goal{background:var(--accent)}
.favo-doc .bar-val{font-family:var(--favo-mono),monospace;font-size:14px;font-weight:500;
  color:var(--ink);white-space:nowrap}
.favo-doc .bar-val small{color:var(--ink-3);font-weight:400;font-size:12px}
@media (max-width:600px){
  .favo-doc .bar-row{grid-template-columns:1fr;gap:5px}
  .favo-doc .bar-label{text-align:left}
}

.favo-doc .pull{margin:32px 0;padding:22px 26px;background:var(--panel);
  border-left:3px solid var(--ink);border-radius:0 4px 4px 0}
.favo-doc .pull p{margin:0;font-size:18px;line-height:1.55;max-width:58ch}
.favo-doc .pull p + p{margin-top:12px}

.favo-doc .strat{border-top:1px solid var(--rule);padding:22px 0 4px}
.favo-doc .strat h3{font-family:var(--favo-ui),sans-serif;font-size:21px;font-weight:600;
  letter-spacing:-.015em;margin:0 0 9px;line-height:1.3}
.favo-doc .strat p{font-size:16.5px;color:var(--ink-2);margin:0 0 12px}
.favo-doc .strat p:last-child{margin-bottom:16px}

.favo-doc .rail{position:sticky;top:24px}
@media (max-width:1000px){.favo-doc .rail{position:static}}
.favo-doc .rail-inner{background:var(--surface);border:1px solid var(--rule);border-radius:5px;
  box-shadow:var(--shadow);overflow:hidden}
.favo-doc .rail-head{padding:22px 24px 18px;border-bottom:1px solid var(--rule);background:var(--panel)}
.favo-doc .rail-head .k{font-family:var(--favo-mono),monospace;font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--ink-2);margin:0 0 8px}
.favo-doc .rail-head h2{font-family:var(--favo-ui),sans-serif;font-size:24px;font-weight:600;
  letter-spacing:-.02em;text-transform:none;color:var(--ink);margin:0 0 8px;line-height:1.2}
.favo-doc .rail-head p{font-size:14.5px;line-height:1.5;color:var(--ink-2);margin:0}
.favo-doc .steps{list-style:none;margin:0;padding:0}
.favo-doc .step{padding:20px 24px;border-top:1px solid var(--rule-soft)}
.favo-doc .step:first-child{border-top:none}
.favo-doc .step .wk{display:flex;align-items:center;gap:9px;margin-bottom:9px}
.favo-doc .step .num{font-family:var(--favo-mono),monospace;font-size:11px;font-weight:500;
  width:21px;height:21px;flex:none;border-radius:50%;display:grid;place-items:center;
  background:var(--ink);color:var(--ground)}
.favo-doc .step .wklabel{font-family:var(--favo-mono),monospace;font-size:11px;
  letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}
.favo-doc .step h3{font-family:var(--favo-ui),sans-serif;font-size:17.5px;font-weight:600;
  margin:0 0 8px;letter-spacing:-.012em;line-height:1.28}
.favo-doc .step ul{margin:0 0 12px;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px}
.favo-doc .step li{font-size:14.5px;line-height:1.45;color:var(--ink-2);padding-left:15px;position:relative}
.favo-doc .step li::before{content:"";position:absolute;left:0;top:.62em;width:5px;height:1.5px;background:var(--ink-3)}
.favo-doc .step .out{font-size:14px;line-height:1.45;color:var(--ink);padding:10px 12px;
  background:var(--accent-soft);border-radius:4px;display:flex;gap:8px;align-items:flex-start}
.favo-doc .step .out span:first-child{color:var(--accent);font-weight:600;flex:none}
.favo-doc .rail-foot{padding:20px 24px 22px;border-top:1px solid var(--rule);background:var(--panel)}
.favo-doc .rail-foot h3{font-family:var(--favo-ui),sans-serif;font-size:15px;font-weight:600;margin:0 0 10px}
.favo-doc .rail-foot ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:7px}
.favo-doc .rail-foot li{font-size:14px;line-height:1.45;color:var(--ink-2);padding-left:15px;position:relative}
.favo-doc .rail-foot li::before{content:"";position:absolute;left:0;top:.62em;width:5px;height:1.5px;background:var(--ink-3)}

.favo-doc .closing{margin-top:16px;padding:34px 0 0;border-top:2px solid var(--ink)}
.favo-doc .closing p{font-size:18px}
.favo-doc .sig{font-family:var(--favo-ui),sans-serif;font-size:14.5px;color:var(--ink-2);
  line-height:1.7;margin-top:26px}
.favo-doc .sig b{color:var(--ink);font-weight:600;font-size:16px}

@media (prefers-reduced-motion: reduce){.favo-doc *{transition:none !important}}
`;

const KATO_RABOTI = [
  {
    title: "Пикселът на Meta е сложен правилно",
    body: (
      <>
        Проверихме го на живо: пиксел <code>2503967079801682</code> ляга <code>PageView</code>,{" "}
        <code>ViewContent</code> и <code>AddToCart</code> — и не празни, а с пълните параметри:
        стойност, валута, номер и име на продукта, категория. Това е коректно направен пиксел.
        Мнозинството магазини, които гледаме, нямат и това.
      </>
    ),
  },
  {
    title: "Касата е бърза и не гони хората",
    body: (
      <>
        Една страница, без задължителна регистрация, четири полета за контакт. BOX NOW е безплатен,
        Еконт и Спиди са с видима цена още преди края. Точно така трябва.
      </>
    ),
  },
  {
    title: "Продуктовите адреси са чисти, а полето за персонализация е на място",
    body: (
      <>
        <code>/dvulicev-klyuchodrzhatel-labubu</code> — четимо и за човек, и за Google. И „Текст за
        персонализация“ стои точно там, където трябва да стои: върху продукта, преди бутона.
      </>
    ),
  },
];

const SHOP = [
  {
    chip: "crit",
    label: "спешно",
    title: "Няма Google Analytics. Изобщо.",
    body: (
      <>
        <p>
          Нула. Няма <code>gtag</code>, няма <code>dataLayer</code>, няма дори бисквитка{" "}
          <code>_ga</code>. Проверено на няколко страници.
        </p>
        <p>
          Meta ви показва само това, което се е случило в Meta. Всичко останало — колко души идват
          от Google, колко директно, колко от имейл, кой канал носи пари и кой само харчи — днес не
          се вижда никъде. Любопитното е, че на favo-decor.com Analytics <b>има</b> (
          <code>G-T1VDW88BGP</code>). Просто на магазина, който върти рекламата, го няма.
        </p>
      </>
    ),
  },
  {
    chip: "crit",
    label: "спешно",
    title: "Категориите нямат адреси, с които да се класират",
    body: (
      <>
        <p>
          Продуктите имат хубави адреси, категориите — не:{" "}
          <code>{"index.php?route=product/category&path=1394_1412"}</code>.
        </p>
        <p>
          А точно категориите са страниците, които печелят търсения като „подарък за първия учебен
          ден“ или „коледни играчки от дърво“. Един продукт хваща едно нещо; една категория хваща
          цял сезон. Отгоре на това каноничният адрес на страницата сочи към <code>path=1412</code>,
          а адресът, на който човек попада, е <code>path=1394_1412</code> — Google получава два
          различни отговора на един въпрос.
        </p>
      </>
    ),
  },
  {
    chip: "crit",
    label: "спешно",
    title: "Няма карта на сайта и няма robots.txt",
    body: (
      <>
        <p>
          <code>sitemap.xml</code> съществува, но е <b>празен файл — 0 байта</b>.{" "}
          <code>robots.txt</code> връща страница „не е намерено“.
        </p>
        <p>
          1 836 продукта, а Google няма списък какво има вътре. Оставено е сам да ги намери през
          менютата — и той намира част от тях, бавно.
        </p>
      </>
    ),
  },
  {
    chip: "warn",
    label: "изтича",
    title: "Заглавията са голи",
    body: (
      <p>
        Началната страница се казва „Favo Shop“. Категорията с детските неща — „За децата“. Никой не
        търси тези думи. А голямото заглавие на началната страница е <code>FAVO-SHOP.COM</code> —
        тоест самият адрес на сайта, написан върху сайта.
      </p>
    ),
  },
  {
    chip: "warn",
    label: "изтича",
    title: "Счупени емоджита в описанията",
    body: (
      <p>
        Описанието на ключодържателя започва с <code>????✨ Сладурски ключодържател…</code> —
        емоджитата не са се записали правилно в базата. Тези въпросителни ги вижда и клиентът, и
        Google, който ги показва в резултатите.
      </p>
    ),
  },
  {
    chip: "warn",
    label: "изтича",
    title: "Каталогът има нужда от разчистване",
    body: (
      <>
        <p>
          В детската категория има продукт с име <b>„11“</b>. Има „ЗНАЧКА – ПОДАРЪК ЗА ПЪРВИЯ УЧЕБЕН
          ДЕН 1“ с излишна единица накрая. И три отделни записа за една и съща кутия за химикалки —{" "}
          <code>kutiya-za-himikalki</code>, <code>-1</code> и <code>-2</code>.
        </p>
        <p>При 1 836 продукта това не се оправя на ръка. Оправя се с правило и минаване наведнъж.</p>
      </>
    ),
  },
  {
    chip: "warn",
    label: "изтича",
    title: "По една снимка на продукт и нула отзива в целия магазин",
    body: (
      <p>
        Продавате нещо, което се държи в ръка — дърво, гравюра, име отгоре. Една снимка не го
        показва. А отзивите са на нула навсякъде, при положение че имате тринайсет години доволни
        хора, които никой не е питал.
      </p>
    ),
  },
  {
    chip: "warn",
    label: "изтича",
    title: "Не може да се плати с карта",
    body: (
      <p>
        Само наложен платеж и банков превод. При BOX NOW клиентът получава линк за плащане по имейл
        или SMS <i>след</i> изпращането — това е едно излишно колебание точно там, където поръчката
        се потвърждава.
      </p>
    ),
  },
  {
    chip: "warn",
    label: "изтича",
    title: "Дребни несъответствия, които се забелязват",
    body: (
      <p>
        Началната страница обещава доставка за 1–2 работни дни, продуктовата — за 1–3. А „безплатна
        доставка над 100 лв.“ стои над цени, които вече са в евро.
      </p>
    ),
  },
];

const DECOR = [
  {
    chip: "crit",
    label: "спешно",
    title: "Сървърът върви на софтуер без поддръжка от 2021 г.",
    body: (
      <>
        <p>
          PHP 7.3.33 не получава поправки за сигурност от <b>декември 2021</b> — почти пет години.
          OpenCart 2.3.0.2 е от 2016-та и също отдавна не се поддържа.
        </p>
        <p>
          През този магазин минават имена, телефони, адреси и булстати на фирми. Това е нещото от
          целия преглед, което не бива да чака дълго — не защото е счупено днес, а защото всяка
          позната дупка стои отворена.
        </p>
      </>
    ),
  },
  {
    chip: "crit",
    label: "спешно",
    title: "Двата магазина ползват един и същ пиксел",
    body: (
      <>
        <p>
          <code>2503967079801682</code> е сложен и на favo-shop.com, и на favo-decor.com. Значи
          търговецът, който взима 200 листа шперплат, и мамата, която търси значка за два лева,
          влизат в едни и същи данни.
        </p>
        <p>
          Meta се учи от това, което вижда, и оптимизира към по-многобройното — а по-многобройни
          винаги ще са дребните поръчки. Така B2B рекламата тихо се насочва към хора, които никога
          няма да купят на едро. Разделят се на два пиксела и всеки започва да учи своята публика.
        </p>
      </>
    ),
  },
  {
    chip: "warn",
    label: "изтича",
    title: "Няма немска версия — при положение че товарите камиони за Германия",
    body: (
      <p>
        <code>/de-de/</code> дава „не е намерено“. Има английска версия и джаджа на Google Translate
        в ъгъла. За пазар, за който имате готово производство, сертификати и логистика, това е
        най-евтината пропусната възможност в целия преглед.
      </p>
    ),
  },
  {
    chip: "warn",
    label: "изтича",
    title: "Регистрацията за търговци е 18 полета — и иска факс",
    body: (
      <>
        <p>
          Име, фамилия, имейл, телефон, <b>факс</b>, фирма, булстат, ЕИК, два адреса, град, пощенски
          код, държава от списък с целия свят, парола, потвърждение.
        </p>
        <p>
          И най-важното: най-горе стои падащо меню „Клиентска група“, оставено на <b>„Default“</b>.
          Търговец, който не го смени — а той няма откъде да знае — влиза и вижда цени на дребно.
          Никъде на страницата не пише думата „едро“ и никъде не се обещава какво печели човекът,
          като се регистрира.
        </p>
      </>
    ),
  },
  {
    chip: "warn",
    label: "изтича",
    title: "Началната страница няма заглавие и няма структурирани данни",
    body: (
      <p>
        Няма нито един H1 — за Google страницата е без тема. Няма и никаква схема (
        <code>schema.org</code>), докато на favo-shop.com такава има. Заглавието в таба пък пише
        „Favo Decore“ при домейн favo-decor — дребно, но брандът се разписва по два начина.
      </p>
    ),
  },
];

const STAPKI = [
  {
    n: 1,
    week: "Седмица 1",
    title: "Да се вижда какво става",
    items: [
      "Google Analytics 4 на favo-shop, със съгласие за бисквитките",
      "Отделен пиксел за всеки магазин и сървърна връзка към Meta",
      "Снимките надолу: 17 MB и 8,5 MB стават под 1,5 MB",
      "Истинска карта на сайта и robots.txt за 1 836-те продукта",
    ],
    out: "За пръв път се вижда кой канал носи пари.",
  },
  {
    n: 2,
    week: "Седмица 2",
    title: "Базата от 2012-та проговаря",
    items: [
      "Тринайсетте години се разделят по това кой какво е купувал",
      "Изоставена количка, писмо след покупка, събуждане на заспалите",
      "Коледният календар се зарежда наведнъж и тръгва сам",
    ],
    out: "Първите поръчки, които не струват рекламен бюджет.",
  },
  {
    n: 3,
    week: "Седмица 3",
    title: "Магазинът спира да затваря в 17:00",
    items: [
      "Агентът поема вечерите и уикенда на favo-shop",
      "Размери, наличности, срокове, персонализация — с думите на Фаво",
      "Обажданията след пет получават отговор",
    ],
    out: "Сутрин ви чака списък: кой какво е питал и къде е спрял.",
  },
  {
    n: 4,
    week: "Седмица 4",
    title: "Лека реклама, но премерена",
    items: [
      "Малък бюджет, само към хора, които вече ви познават",
      "Базата влиза в Meta като публика и от нея се прави близка аудитория",
      "Три кратки клипа от цеха: лазерът реже, името се появява",
    ],
    out: "Готово за Коледа — и вече измеримо до стотинка.",
  },
];

function Finding({
  chip,
  label,
  title,
  children,
}: {
  chip: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="finding">
      <span className={`chip ${chip}`}>{label}</span>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export default function FavoPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap" lang="bg">
        <header className="masthead">
          <p className="eyebrow">Технически преглед · 3 септември 2026</p>
          <h1>Двата магазина на Favo</h1>
          <p className="deck">
            Разгледахме favo-shop.com и favo-decor.com отвън — така, както ги вижда клиентът и както
            ги вижда Google. Ето какво работи, какво изтича и откъде се тръгва, за да е всичко
            готово за Коледа.
          </p>
          <div className="byline">
            <span>
              За <b>Любо Флорев</b> · Фаво, Свищов
            </span>
            <span>
              От <b>Ивайло Петев</b> · Pro Marketing
            </span>
            <span>
              <b>1 836</b> продукта в каталога
            </span>
            <a className="pdf" href="/oferta/favo/Favo-analiz.pdf" download>
              Свали като PDF
            </a>
          </div>
        </header>

        <div className="cols">
          <main>
            <section>
              <h2>Първо доброто</h2>
              <p className="h2sub">Има неща, които вече са направени както трябва</p>
              <p className="lead">
                Тръгваме от тях, защото те са основата — върху нея се строи, не се започва отначало.
              </p>
              {KATO_RABOTI.map((f) => (
                <Finding key={f.title} chip="ok" label="работи" title={f.title}>
                  <p>{f.body}</p>
                </Finding>
              ))}
            </section>

            <section>
              <h2>Килограмите</h2>
              <p className="h2sub">Двата сайта тежат колкото цял филм</p>

              <figure>
                <div className="bars">
                  <div className="bar-row">
                    <div className="bar-label">
                      favo-decor.com
                      <br />
                      начална
                    </div>
                    <div className="bar-track">
                      <div className="bar is-crit" style={{ width: "100%" }} />
                      <span className="bar-val">17,2 MB</span>
                    </div>
                  </div>
                  <div className="bar-row">
                    <div className="bar-label">
                      favo-shop.com
                      <br />
                      начална
                    </div>
                    <div className="bar-track">
                      <div className="bar is-crit" style={{ width: "49.4%" }} />
                      <span className="bar-val">8,5 MB</span>
                    </div>
                  </div>
                  <div className="bar-row">
                    <div className="bar-label">разумна цел</div>
                    <div className="bar-track">
                      <div className="bar is-goal" style={{ width: "8.7%" }} />
                      <span className="bar-val">
                        1,5 MB <small>· постижимо за един ден</small>
                      </span>
                    </div>
                  </div>
                </div>
                <figcaption>
                  Тегло на началната страница при първо зареждане, измерено на 3 септември 2026.
                </figcaption>
              </figure>

              <Finding chip="crit" label="спешно" title="Едно лого от 7,2 MB, заредено два пъти">
                <p>
                  На favo-decor.com логото в началото на страницата тежи <b>7,2 мегабайта</b> и се
                  изтегля <b>два пъти</b> — веднъж за големия екран, веднъж за малкия. Заедно с още
                  едно изображение от 4 MB, три файла правят 15 от общо 17-те мегабайта.
                </p>
                <p>Едно лого трябва да тежи под 100 килобайта. Тук е около сто пъти повече.</p>
              </Finding>

              <Finding
                chip="crit"
                label="спешно"
                title="На favo-shop нито една снимка не се зарежда отложено"
              >
                <p>
                  И 41-те изображения се теглят наведнъж, включително тези на дъното, които никой
                  няма да види. Банерът е 2,1 MB, а един файл е качен направо както е излязъл от
                  ChatGPT — 1,1 MB. Стиловете сами по себе си са 3 MB.
                </p>
                <p>
                  Значението е просто: човек на мобилен интернет чака. Google мери точно това време
                  и го използва, когато подрежда резултатите. А при реклама кликът е платен още
                  преди страницата да се е показала.
                </p>
              </Finding>
            </section>

            <section>
              <div className="shopbar">
                <span className="name">favo-shop.com</span>
                <span className="role">магазинът към хората</span>
              </div>
              <p className="stackline">OpenCart 3 · тема Journal3 · 1 836 продукта</p>
              {SHOP.map((f) => (
                <Finding key={f.title} chip={f.chip} label={f.label} title={f.title}>
                  {f.body}
                </Finding>
              ))}
            </section>

            <section>
              <div className="shopbar">
                <span className="name">favo-decor.com</span>
                <span className="role">магазинът към фирмите</span>
              </div>
              <p className="stackline">OpenCart 2.3.0.2 · PHP 7.3.33 · тема Trendo</p>
              {DECOR.map((f) => (
                <Finding key={f.title} chip={f.chip} label={f.label} title={f.title}>
                  {f.body}
                </Finding>
              ))}
            </section>

            <section>
              <h2>Стратегията</h2>
              <p className="h2sub">Три решения, преди която и да е задача</p>

              <div className="strat">
                <h3>1. Срещу Temu не се играе с цена</h3>
                <p>
                  Вие го казахте на телефона: сривът дойде, когато китайските платформи заляха Meta.
                  Срещу техния бюджет бюджет не помага. Помага това, което те нямат и не могат да
                  купят.
                </p>
                <p>
                  Вие произвеждате сами, в Свищов. Работите с FSC материал и нискоемисионни лепила.
                  Изнасяте за Германия. И слагате името на детето върху продукта за два дни. Temu не
                  може да гравира „Алекс“ и да го достави във вторник. Това е разказът — и той трябва
                  да е в рекламите, вместо процента отстъпка.
                </p>
              </div>

              <div className="strat">
                <h3>2. Двата магазина да спрат да си пречат</h3>
                <p>
                  Днес favo-shop кани търговци на едро, а favo-decor продава на дребно и двата
                  споделят един пиксел. Ролите се размиват — и за клиента, и за Meta.
                </p>
                <p>
                  favo-shop е емоция: подаръкът с име, сезонът, бързата доставка. favo-decor е
                  сметка: материал, количество, повторна поръчка, кредит. Различни хора, различни
                  думи, различни данни.
                </p>
              </div>

              <div className="strat">
                <h3>3. Календарът командва, не желанието</h3>
                <p>
                  Днес е 3 септември. Търсенето на коледни подаръци тръгва около 15 октомври и
                  приключва към 20 декември. В тези десет седмици се прави годината при подаръците —
                  а каталогът ви е пълен с коледни топки и фигурки.
                </p>
                <p>
                  Всичко, което не е готово до <b>15 октомври</b>, реално чака до март. Затова
                  първите четири седмици вдясно са подредени по този срок, а не по това кое е
                  най-приятно да се направи.
                </p>
              </div>
            </section>

            <div className="pull">
              <p>
                <b>Едно изречение за целия преглед:</b> магазините не са зле построени — те са
                непочистени и неизмерени.
              </p>
              <p>
                Пикселът работи, касата работи, продуктите са ваши. Липсва измерване, липсва тегло
                под контрол и липсва адрес, на който Google да ви намери. Това са поправими неща, и
                то бързо.
              </p>
            </div>

            <div className="closing">
              <p>
                Тринайсет години клиенти, собствен цех и два магазина е повече, отколкото имат почти
                всички, с които работим. Оттук нататък въпросът не е какво да се строи, а в какъв ред
                да се пипне — и дали ще стане преди Коледа.
              </p>
              <p className="sig">
                <b>Ивайло Петев</b>
                <br />
                Pro Marketing LTD · 0877 399 963
                <br />
                promarketing.pw
              </p>
            </div>
          </main>

          <aside className="rail">
            <div className="rail-inner">
              <div className="rail-head">
                <p className="k">Откъде се тръгва</p>
                <h2>Първите 30 дни</h2>
                <p>
                  Подредени по това кое връща пари най-бързо — и кое трябва да е готово преди 15
                  октомври.
                </p>
              </div>

              <ol className="steps">
                {STAPKI.map((s) => (
                  <li className="step" key={s.n}>
                    <div className="wk">
                      <span className="num mono">{s.n}</span>
                      <span className="wklabel">{s.week}</span>
                    </div>
                    <h3>{s.title}</h3>
                    <ul>
                      {s.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                    <p className="out">
                      <span>→</span>
                      <span>{s.out}</span>
                    </p>
                  </li>
                ))}
              </ol>

              <div className="rail-foot">
                <h3>За да тръгне, трябват само три неща</h3>
                <ul>
                  <li>Достъп до админ панелите на двата магазина</li>
                  <li>Изнесена базата от 2012-та, както е</li>
                  <li>Четирсет минути да минем стъпките заедно</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
