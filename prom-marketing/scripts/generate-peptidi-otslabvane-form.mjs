#!/usr/bin/env node
// Lead форма за пептиди · отслабване — извлечени точно както са в банера.
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
// ВЪПРОСИ ОТ БАНЕРА — 1:1 в реда от 1 до 8
// ============================================================
const QUESTIONS = [
  {
    n: 1,
    text: 'Каква е основната ви цел?',
    type: 'Multiple choice · един отговор',
    options: [
      'Отслабване',
      'Контрол на апетита',
      'Повече енергия',
      'Подобряване на форма и тонус',
      'Wellness и дълголетие',
      'Друго',
    ],
  },
  {
    n: 2,
    text: 'Колко килограма бихте искали да свалите?',
    type: 'Multiple choice · един отговор',
    options: [
      '5-10 кг',
      '10-20 кг',
      '20+ кг',
      'Отслабването не е основната ми цел',
    ],
  },
  {
    n: 3,
    text: 'Запознати ли сте с пептидите и wellness протоколите?',
    type: 'Multiple choice · един отговор',
    options: [
      'Да, добре съм запознат/а',
      'Чувал/а съм, но не съм използвал/а',
      'Използвал/а съм пептиди или GLP-1 продукти',
      'Не, искам да науча повече',
    ],
    info: 'Пептидите са кратки аминокиселинни вериги, които могат да подпомогнат различни процеси в организма — като отслабване, контрол на апетита, енергия, възстановяване и др.',
  },
  {
    n: 4,
    text: 'Опитвали ли сте други методи досега?',
    type: 'Multiple choice · избор на няколко',
    options: [
      'Диети',
      'Тренировъчни програми',
      'Хранителни добавки',
      'Медикаменти за отслабване (ненептидни)',
      'Не',
    ],
  },
  {
    n: 5,
    text: 'Кога бихте искали да започнете?',
    type: 'Multiple choice · един отговор',
    options: [
      'Веднага',
      'До 30 дни',
      'Засега само се информирам',
    ],
  },
  {
    n: 6,
    text: 'Име и фамилия *',
    type: 'Кратък текст · задължително',
    placeholder: 'Въведете име и фамилия',
  },
  {
    n: 7,
    text: 'Телефонен номер *',
    type: 'Телефон · задължително',
    placeholder: 'Въведете телефонен номер',
  },
  {
    n: 8,
    text: 'Имейл адрес *',
    type: 'Имейл · задължително',
    placeholder: 'Въведете имейл адрес',
  },
];

const form = {
  niche: 'Отслабване с пептиди',
  pageTitle: 'WEIGHT LOSS с пептиди: как работят и как можете да свалите килограми по умен начин',
  pageSubtitle: 'Научете как пептидите могат да подкрепят вашите цели за отслабване, енергия и по-добро здраве',
  pillars: [
    {
      icon: 'ДНК',
      title: 'Подпомагат метаболизма',
      body: 'Активират естествени процеси за изгаряне на мазнини',
    },
    {
      icon: 'Огън',
      title: 'Контролират апетита',
      body: 'Намаляват глада и желанието за вредни храни',
    },
    {
      icon: 'Мускул',
      title: 'Подобряват телесния състав',
      body: 'Запазват мускулната маса и оформят фигурата',
    },
  ],
  privacy: 'Вашата информация е защитена. Използваме я само, за да се свържем с вас и да ви предоставим персонализирана помощ.',
  cta: 'Направете първата стъпка към по-добра версия на себе си! Ние ще ви помогнем с персонализиран подход и научно базирани решения с пептиди.',
  intro: 'Отговорете на няколко кратки въпроса, за да разберем по-добре вашите цели и дали персонализираната wellness консултация с пептиди е подходяща за вас. Нашият екип ще се свърже с вас скоро.',
  finalCta: {
    headline: 'Благодаря! Ще се свържем в рамките на 2 часа.',
    body: 'Ще получите обаждане от Ваня — кратък безплатен разговор (10-15 мин), в който ще ви обясним точно как пептидните протоколи могат да помогнат конкретно за вашия случай.',
  },
  followUp: [
    'Обаждане в рамките на 2 часа (workdays 9-19)',
    'Първоначална консултация 10-15 мин — изясняване на цели и история',
    'Изпращане на персонална оферта по имейл/Viber',
    'Follow-up след 24ч ако няма отговор',
    'Закриване на сделка / отписване след 7 дни без отговор',
  ],
};

// ============================================================
// Sections
// ============================================================
const header = [
  title('Lead форма · ' + form.niche),
  subtitle('Vanq Biznes · Meta Ads Manager · предложение от ProMarketing'),
  noteBox('ЦЕЛ:', 'Извлечени въпроси 1:1 от рекламния банер „WEIGHT LOSS с пептиди". Идеална за директно качване в Meta Lead Form — отговорите ще съответстват на това, което вижда потребителят в банера.', 'F3E8FF', 'C4B5FD'),
  spacer(),
];

const welcome = [
  h2('1. Welcome екран (преди формата)'),
  h3('Главно заглавие'),
  body(form.pageTitle, { bold: true }),
  h3('Подзаглавие'),
  body(form.pageSubtitle),
  h3('Трите основни ползи (както в банера)'),
  ...form.pillars.flatMap((p) => [
    body(`${p.title}`, { bold: true, color: COLOR_ACCENT }),
    body(p.body),
  ]),
  spacer(),
  noteBox('ВЪВЕДЕНИЕ КЪМ ФОРМАТА:', form.intro, 'EEF2FF', 'A5B4FC'),
  spacer(),
];

const questionsSection = [h2('2. Въпроси във формата (1:1 от банера)')];
QUESTIONS.forEach((q) => {
  questionsSection.push(h3(`${q.n}. ${q.text}`, COLOR_ACCENT));
  questionsSection.push(body(`Тип: ${q.type}`, { italics: true, color: COLOR_TEXT_LIGHT }));
  if (q.options) {
    q.options.forEach((opt) => questionsSection.push(bullet(opt)));
  }
  if (q.placeholder) {
    questionsSection.push(body(`Placeholder: ${q.placeholder}`, { italics: true, color: COLOR_TEXT_LIGHT }));
  }
  if (q.info) {
    questionsSection.push(noteBox('ИНФО под въпроса:', q.info, 'FEF3C7', 'FCD34D'));
  }
  questionsSection.push(spacer());
});

const privacyAndCTA = [
  h2('3. Privacy & финален екран'),
  h3('Privacy текст (под въпросите)'),
  body(form.privacy, { italics: true, color: COLOR_TEXT_LIGHT, size: SIZE_SMALL }),
  h3('CTA блок преди подаване'),
  body(form.cta),
  h3('Thank you екран (след submit)'),
  body(form.finalCta.headline, { bold: true }),
  body(form.finalCta.body),
  spacer(),
];

const followUpSection = [
  h2('4. Процес след получаване на лид'),
  ...form.followUp.map((s, i) => bullet(`Стъпка ${i + 1}: ${s}`)),
  spacer(),
  noteBox(
    'ВРЕМЕ ЗА ОБАЖДАНЕ:',
    'Препоръчвам обаждане в рамките на 2 часа след подаване на формата. Лидовете „изстиват" много бързо — след 24ч интересът пада с над 70%.',
    'FEF3C7',
    'FCD34D'
  ),
];

const footerSection = [
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
        bold: true,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'Подготвено 29.05.2026 · за преглед и одобрение от Ваня Димитрова (Vanq Biznes / PeptidesEdu)',
        font: FONT,
        color: COLOR_TEXT_LIGHT,
        size: SIZE_SMALL,
        italics: true,
      }),
    ],
  }),
];

const doc = new Document({
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
        ...header,
        ...welcome,
        ...questionsSection,
        ...privacyAndCTA,
        ...followUpSection,
        ...footerSection,
      ],
    },
  ],
});

const out = 'C:/Users/User/Desktop/Lead-Forma-Peptidi-Otslabvane.docx';
const buf = await Packer.toBuffer(doc);
fs.writeFileSync(out, buf);
console.log(`OK ${out} (${(buf.length / 1024).toFixed(1)} KB)`);
