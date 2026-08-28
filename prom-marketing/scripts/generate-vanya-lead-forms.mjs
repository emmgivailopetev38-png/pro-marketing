#!/usr/bin/env node
// Generates 2 Word documents with lead form proposals for Vanya.
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType
} from 'docx';
import fs from 'node:fs';

const FONT = 'Arial';
const COLOR_PRIMARY = '0F0A1E';
const COLOR_ACCENT = '7C3AED';
const COLOR_TEXT_LIGHT = '4B5563';

const SIZE_TITLE = 36;
const SIZE_H2 = 28;
const SIZE_H3 = 24;
const SIZE_BODY = 22;
const SIZE_SMALL = 20;

const title = (text) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [new TextRun({ text, font: FONT, color: COLOR_PRIMARY, size: SIZE_TITLE, bold: true })],
  });

const subtitle = (text) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 320 },
    children: [new TextRun({ text, font: FONT, color: COLOR_ACCENT, size: SIZE_BODY, italics: true })],
  });

const h2 = (text) =>
  new Paragraph({
    spacing: { before: 320, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_ACCENT, space: 4 } },
    children: [new TextRun({ text, font: FONT, color: COLOR_PRIMARY, size: SIZE_H2, bold: true })],
  });

const h3 = (text, color = COLOR_PRIMARY) =>
  new Paragraph({
    spacing: { before: 220, after: 80 },
    children: [new TextRun({ text, font: FONT, color, size: SIZE_H3, bold: true })],
  });

const body = (text, options = {}) =>
  new Paragraph({
    spacing: { after: 100 },
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text, font: FONT, color: COLOR_PRIMARY, size: SIZE_BODY, ...options })],
  });

const bullet = (text) =>
  new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: FONT, color: COLOR_PRIMARY, size: SIZE_BODY })],
  });

const noteBox = (label, text, bg = 'F3E8FF', border = 'C4B5FD') =>
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: bg, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: border },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: border },
              left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_ACCENT },
              right: { style: BorderStyle.SINGLE, size: 8, color: border },
            },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: label + ' ', font: FONT, color: COLOR_ACCENT, size: SIZE_SMALL, bold: true }),
                  new TextRun({ text, font: FONT, color: COLOR_PRIMARY, size: SIZE_BODY }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

const spacer = () => new Paragraph({ spacing: { after: 100 }, children: [] });

const numbering = {
  config: [
    {
      reference: 'bullets',
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
      ],
    },
  ],
};

// ============================================================
// Lexicon — use Bulgarian smart quotes via escapes so quotes stay safe
// ============================================================
const Q_OPEN = '„';  // „
const Q_CLOSE = '”'; // "

// Helper to wrap a phrase in BG quotes
const q = (s) => `${Q_OPEN}${s}${Q_CLOSE}`;

// ============================================================
// FORM 1: ANTI-AGE
// ============================================================
const antiAgeForm = {
  niche: 'Анти-Age (пептиди за подмладяване)',
  headline: 'Целим жени 35-65г, които искат натурално подмладяване без инжекции и козметични процедури — но са готови да инвестират в качествено решение.',
  audience: [
    'Жени 35-65г (фокус 40-55г)',
    'Имат разполагаем доход (бюджет 200+ €/мес)',
    'Опитвали са козметика, но без видим резултат',
    'Не са готови за ботокс/филъри (страх от инвазивни процедури)',
    'Активни в социалните мрежи, следят wellness тенденции',
  ],
  painPoints: [
    'Първи дълбоки бръчки около очите и устните',
    'Загуба на стегнатост на кожата (увисване)',
    'Тен на кожата изгубва свежест',
    'Бавно зарастване, по-сухa кожа',
    `Усещане ${q('остарявам по-бързо от връстниците ми')}`,
  ],
  welcome: {
    headline: 'Подмладете кожата си с пептиди — без инжекции, без болка',
    subhead: 'Естествен начин да върнете стегнатостта, гладкостта и блясъка на кожата. Открийте дали пептидите са решението за вас.',
  },
  cta: 'Проверете дали е за вас (2 минути)',
  questions: [
    { text: 'Име и фамилия', type: 'Кратък текст · auto-fill от Facebook' },
    {
      text: 'Възраст',
      type: 'Dropdown',
      options: ['До 35 г', '35-44 г', '45-54 г', '55-64 г', '65+ г'],
      note: 'Сегментира офертата — за 35-44 акцент върху превенция, за 45+ върху възстановяване.',
    },
    {
      text: 'Кое е главното, което искате да подобрите?',
      type: 'Multiple choice (избор на едно)',
      options: [
        'Бръчки около очи / устни',
        'Увисване на овала на лицето',
        'Тен и блясък на кожата',
        'Сухота и качество на кожата',
        'Общо подмладяване / превенция',
      ],
      note: 'Помага на Ваня да започне разговора точно по нуждата на клиентката.',
    },
    {
      text: 'Какво сте опитвали досега?',
      type: 'Multiple choice (избор на няколко)',
      options: [
        'Скъпи кремове и серуми',
        'Козметични процедури (пилинг, дермабразио)',
        'Инжекции (ботокс, филъри)',
        'Хранителни добавки',
        'Нищо специално',
      ],
      note: 'Филтрира — ако вече е правила всичко, по-склонна да опита нещо ново и да плати повече.',
    },
    {
      text: 'Бюджет за подмладяване (на месец)',
      type: 'Multiple choice (избор на едно)',
      options: ['До 100 €/мес', '100-200 €/мес', '200-500 €/мес', '500+ €/мес', 'Не съм мислила'],
      note: 'НАЙ-ВАЖЕН ФИЛТЪР: пептиди не са евтини. Под 100 € не е реален клиент. Над 200 € е перфектно.',
    },
    {
      text: 'Кога искате да започнете?',
      type: 'Multiple choice (избор на едно)',
      options: ['Веднага', 'В следващите 2 седмици', 'През следващия месец', 'Просто се информирам'],
      note: `${q('Просто се информирам')} = ниско качество, пропускай. ${q('Веднага')} / ${q('2 седмици')} = hot lead.`,
    },
    {
      text: 'Имате ли алергии или хронични заболявания?',
      type: 'Multiple choice',
      options: ['Не, здрава съм', 'Имам алергии (ще ги обсъдим)', 'Хронично заболяване', 'Бременна / кърмеща'],
      note: 'Защита: ако бременна/кърмеща → autoматично не препоръчваш пептиди.',
    },
    { text: 'Телефонен номер', type: 'Auto-fill от Facebook · задължително' },
  ],
  privacy: 'С подаването на формата се съгласявам ProMarketing/Vanq Biznes да се свърже с мен по телефон, имейл или Viber/WhatsApp. Данните се обработват съгласно GDPR и Privacy Policy.',
  finalCta: {
    headline: 'Благодаря! Ще се свържем в рамките на 2 часа.',
    body: 'Ще получите обаждане от Ваня — кратък безплатен разговор (10-15 мин), в който ще ви обясним точно как пептидите могат да помогнат конкретно за вашия случай.',
  },
  followUp: [
    'Обаждане в рамките на 2 часа (workdays 9-19)',
    'Първоначална консултация 10-15 мин — изясняване на нуждите',
    'Изпращане на персонална оферта по имейл/Viber',
    'Follow-up след 24ч ако няма отговор',
    'Закриване на сделка / отписване след 7 дни без отговор',
  ],
};

// ============================================================
// FORM 2: HAIR LOSS (КОСОПАД)
// ============================================================
const hairLossForm = {
  niche: 'Косопад · пептидно възстановяване на косата',
  headline: 'Целим хора 25-55г (мъже + жени), които виждат активен косопад и искат решение преди да са оплешивели — но не са готови за хирургична трансплантация.',
  audience: [
    'Мъже 25-50г (35% от лидовете)',
    'Жени 30-55г (65% от лидовете — често след раждане или хормонални промени)',
    'Виждат активна загуба на коса в последните 6-18 месеца',
    'Опитвали са шампоани, витамини — без резултат',
    'Не са готови за трансплантация (твърде рано или твърде скъпо)',
  ],
  painPoints: [
    'Виждат повече коса в банята / на четката',
    'Прорежда се при темето / челото / на път (жени)',
    'Усещане за тънка, безжизнена коса',
    'Срам / неувереност — избягват социални събития',
    `Страх ${q('ще оплешивея напълно')}`,
  ],
  welcome: {
    headline: 'Възстановете косата си с пептиди — без операция, без скъпи трансплантации',
    subhead: 'Естествена стимулация на космените фоликули. Открийте дали пептидното лечение е решението за вас.',
  },
  cta: 'Безплатна оценка на косопада ви (2 минути)',
  questions: [
    { text: 'Име и фамилия', type: 'Кратък текст · auto-fill от Facebook' },
    {
      text: 'Пол',
      type: 'Multiple choice (избор на едно)',
      options: ['Мъж', 'Жена'],
      note: 'КРИТИЧЕН ФИЛТЪР — мъжкият и женският косопад имат различни причини и лечения. Различни оферти.',
    },
    {
      text: 'Възраст',
      type: 'Dropdown',
      options: ['До 25 г', '25-34 г', '35-44 г', '45-54 г', '55+ г'],
    },
    {
      text: 'От колко време забелязвате косопад?',
      type: 'Multiple choice (избор на едно)',
      options: ['По-малко от 3 месеца', '3-6 месеца', '6-12 месеца', 'Над 1 година', 'Над 3 години'],
      note: 'До 1 година = висок шанс за възстановяване. Над 3 години = образувани плешиви зони, по-трудно.',
    },
    {
      text: 'Засилва ли се косопадът?',
      type: 'Multiple choice (избор на едно)',
      options: ['Да, активно се влошава', 'Стабилно е (нито по-зле, нито по-добре)', 'Изглежда се забавя'],
      note: 'Активно влошаване = спешен случай, по-висока готовност да купи решение веднага.',
    },
    {
      text: 'Къде е най-видимото изтъняване?',
      type: 'Multiple choice (избор на няколко)',
      options: [
        'Темето (върха на главата)',
        'Челото / отстъпващи слепоочия',
        'По цялата глава дифузно',
        'На път (за жени)',
        'Брада / други зони',
      ],
      note: 'Помага на Ваня да реши тип на оферта (точково vs системно лечение).',
    },
    {
      text: 'Опитвали ли сте досега нещо?',
      type: 'Multiple choice (избор на няколко)',
      options: [
        'Специализирани шампоани (Vichy, Nioxin и др.)',
        'Хранителни добавки (биотин, омега 3)',
        'Лечение от дерматолог (миноксидил, финастерид)',
        'Месотерапия / PRP',
        'Нищо специално',
      ],
      note: 'Който е опитвал няколко неща без резултат → готов да опита пептиди + да плати повече.',
    },
    {
      text: 'Бюджет за решение (на месец)',
      type: 'Multiple choice (избор на едно)',
      options: ['До 100 €/мес', '100-200 €/мес', '200-500 €/мес', '500+ €/мес', 'Не съм мислил/а'],
      note: 'НАЙ-ВАЖЕН ФИЛТЪР: Под 100 € = не е реален клиент. Лечението е минимум 3-6 месеца.',
    },
    {
      text: 'Имате ли диагностицирани хормонални проблеми или хронични заболявания?',
      type: 'Multiple choice (избор на няколко)',
      options: [
        'Не, здрав/а съм',
        'Щитовидна жлеза',
        'PCOS (поликистозни яйчници)',
        'Анемия / дефицит на желязо',
        'Бременна / кърмеща',
        'Друго',
      ],
      note: 'Помага да се препоръча правилно решение + изключва бременни/кърмещи.',
    },
    {
      text: 'Кога искате да започнете лечение?',
      type: 'Multiple choice (избор на едно)',
      options: ['Веднага', 'В следващите 2 седмици', 'През следващия месец', 'Просто се информирам'],
    },
    { text: 'Телефонен номер', type: 'Auto-fill от Facebook · задължително' },
  ],
  privacy: 'С подаването на формата се съгласявам ProMarketing/Vanq Biznes да се свърже с мен по телефон, имейл или Viber/WhatsApp. Данните се обработват съгласно GDPR и Privacy Policy.',
  finalCta: {
    headline: 'Благодаря! Ще се свържем в рамките на 2 часа.',
    body: 'Ще получите обаждане от Ваня — кратък безплатен разговор (10-15 мин), в който ще ви обясним точно как пептидите могат да възстановят косата ви.',
  },
  followUp: [
    'Обаждане в рамките на 2 часа (workdays 9-19)',
    'Първоначална консултация 10-15 мин — оценка на тежестта на косопада',
    'Възможно е да поискаме снимка на главата за по-точна оценка',
    'Изпращане на персонална оферта по имейл/Viber',
    'Follow-up след 24ч и след 7 дни ако няма отговор',
  ],
};

// ============================================================
// Section builders
// ============================================================
function header(niche) {
  return [
    title(`Lead форма · ${niche}`),
    subtitle('Vanq Biznes · Meta Ads Manager · предложение от ProMarketing'),
    noteBox(
      'ЦЕЛ:',
      `Повишаване на качеството на лидовете. Сегашната форма дава около €0.67/лид, но повечето са просто любопитни. С тази структура филтрираме хора, които наистина искат решение, имат бюджет и са готови да действат — очаквани €3-5 за качествен лид.`,
      'F3E8FF',
      'C4B5FD'
    ),
    spacer(),
  ];
}

function intro(headline, audience, painPoints) {
  return [
    h2('1. Контекст на формата'),
    body(headline, { bold: true }),
    spacer(),
    h3('Целева аудитория'),
    ...audience.map((a) => bullet(a)),
    h3('Болезнени точки, които адресираме'),
    ...painPoints.map((p) => bullet(p)),
  ];
}

function welcomeScreen(welcome, cta) {
  return [
    h2('2. Welcome екран (преди формата)'),
    h3('Заглавие'),
    body(welcome.headline, { bold: true }),
    h3('Подзаглавие / описание'),
    body(welcome.subhead),
    h3('CTA бутон'),
    noteBox('→', cta, 'EEF2FF', 'A5B4FC'),
    spacer(),
  ];
}

function questionsSection(questions) {
  const children = [h2('3. Въпроси във формата')];
  questions.forEach((q, i) => {
    children.push(h3(`${i + 1}. ${q.text}`, COLOR_ACCENT));
    if (q.type) {
      children.push(body(`Тип: ${q.type}`, { italics: true, color: COLOR_TEXT_LIGHT }));
    }
    if (q.options && q.options.length) {
      q.options.forEach((opt) => children.push(bullet(opt)));
    }
    if (q.note) {
      children.push(noteBox('ЗАЩО:', q.note, 'FEF3C7', 'FCD34D'));
    }
    children.push(spacer());
  });
  return children;
}

function privacyAndCTA(privacyText, finalCta) {
  return [
    h2('4. Privacy & финален екран'),
    h3('Privacy текст (под въпросите)'),
    body(privacyText, { italics: true, color: COLOR_TEXT_LIGHT, size: SIZE_SMALL }),
    h3('Thank you екран (след submit)'),
    body(finalCta.headline, { bold: true }),
    body(finalCta.body),
    spacer(),
  ];
}

function followUp(steps) {
  return [
    h2('5. След получаване на лид · процес'),
    ...steps.map((s, i) => bullet(`Стъпка ${i + 1}: ${s}`)),
    spacer(),
    noteBox(
      'ВРЕМЕ:',
      `Препоръчвам обаждане в рамките на 2 часа след подаване на формата. Лидовете ${q('изстиват')} много бързо — след 24ч интересът пада с над 70%.`,
      'FEF3C7',
      'FCD34D'
    ),
  ];
}

function alternatives() {
  return [
    h2('6. Алтернативни варианти'),
    h3('Лек вариант (5 въпроса, повече обем)'),
    body('Запазваш само: Име, Възраст, Цел, Телефон, Имейл. По-нисък €/лид, но повече просто любопитни.'),
    h3('Строг вариант (11 въпроса, само сериозни)'),
    body(`Добавяш: Здравословно състояние (изключва бременни/кърмещи), часова зона за обаждане, отворен въпрос ${q('Защо точно сега?')}. €8-15/лид, но 70-80% реално купуват.`),
    spacer(),
    noteBox(
      'ПРЕПОРЪКА:',
      'Стартирай със средния вариант по-горе (8-11 въпроса). След 2 седмици виждаме данните и решаваме дали да тестваме строгия вариант паралелно (A/B тест).',
      'DCFCE7',
      '86EFAC'
    ),
  ];
}

function footer() {
  return [
    spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      border: { top: { style: BorderStyle.SINGLE, size: 8, color: 'D1D5DB', space: 8 } },
      children: [
        new TextRun({
          text: 'ProMarketing ЕООД · Ивайло Петев · emmgivailopetev38@gmail.com · +359 877 399 963',
          font: FONT,
          color: COLOR_TEXT_LIGHT,
          size: SIZE_SMALL,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Подготвено 28.05.2026 · за преглед и одобрение от Ваня Димитрова (Vanq Biznes)',
          font: FONT,
          color: COLOR_TEXT_LIGHT,
          size: SIZE_SMALL,
          italics: true,
        }),
      ],
    }),
  ];
}

function buildDoc(form) {
  return new Document({
    numbering,
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          ...header(form.niche),
          ...intro(form.headline, form.audience, form.painPoints),
          ...welcomeScreen(form.welcome, form.cta),
          ...questionsSection(form.questions),
          ...privacyAndCTA(form.privacy, form.finalCta),
          ...followUp(form.followUp),
          ...alternatives(),
          ...footer(),
        ],
      },
    ],
  });
}

const out1 = 'C:/Users/User/Desktop/Lead-Forma-Anti-Age.docx';
const out2 = 'C:/Users/User/Desktop/Lead-Forma-Kosopad.docx';

const buf1 = await Packer.toBuffer(buildDoc(antiAgeForm));
fs.writeFileSync(out1, buf1);
console.log(`OK ${out1} (${(buf1.length / 1024).toFixed(1)} KB)`);

const buf2 = await Packer.toBuffer(buildDoc(hairLossForm));
fs.writeFileSync(out2, buf2);
console.log(`OK ${out2} (${(buf2.length / 1024).toFixed(1)} KB)`);
