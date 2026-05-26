#!/usr/bin/env node
// За всеки клиент с готов PDF — авто-качва PDF-а в неговия архив.

const TOKEN = "d57f2e068ec50e6ebccc5e98dbf9a9189a2fbaa238b22354036250334a57872e";
const HOST = "https://promarketing.pw";

async function uploadPdfFromUrl({ contactId, pdfUrl, filename, category, description }) {
  // 1. Свали PDF-а от източника
  const pdfRes = await fetch(`${HOST}${pdfUrl}?v=${Date.now()}`);
  if (!pdfRes.ok) {
    return { error: `download failed: ${pdfRes.status}` };
  }
  const blob = await pdfRes.blob();

  // 2. Качи в архива
  const fd = new FormData();
  fd.append("file", new File([blob], filename, { type: "application/pdf" }));
  fd.append("category", category);
  fd.append("description", description);
  fd.append("uploaded_by", "ivailopetev38@gmail.com");

  const up = await fetch(`${HOST}/api/admin/contacts/${contactId}/files`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${TOKEN}` },
    body: fd,
  });
  return up.json();
}

const UPLOADS = [
  // Васил Бедров (Evolto) — оферта + договор v2
  {
    contactId: "366aba84-ba3f-4697-83f9-b8690d16e2d4",
    name: "Васил Бедров (Evolto)",
    files: [
      { pdfUrl: "/api/oferta/evolto/pdf", filename: "Evolto-Oferta-v2.pdf", category: "oferta", description: "Оферта v2 (с корекции от юрист). 2000€ без ДДС, 50/50, срок 30-60 дни." },
      { pdfUrl: "/api/oferta/evolto/contract", filename: "Evolto-Dogovor-v2.pdf", category: "dogovor", description: "Договор v2 (с корекции от юрист). Чл. 5 Задължения възложител, чл. 6 Задължения изпълнител, чл. 7 Конфиденциалност, чл. 9 Неустойки." },
    ],
  },
  // Теодор Лозев — презентация
  {
    contactId: "0bab6818-3dfe-4d90-9454-6ec932d55ef9",
    name: "Теодор Лозев (Строителство)",
    files: [
      { pdfUrl: "/api/oferta/teodor/pdf", filename: "Teodor-Lozev-Prezentaciya.pdf", category: "oferta", description: "Персонална презентация — AI операционна система за строителен бранш. 6 модула: Dashboard, Склад с AI, КСС, Счетоводство, AI Sales, Чат бот." },
    ],
  },
  // Росен Костадинов (Golden Key) — презентация
  {
    contactId: "c273d183-93d6-4a06-98fb-13fe851fc9fc",
    name: "Росен Костадинов (Golden Key)",
    files: [
      { pdfUrl: "/api/oferta/golden-key/pdf", filename: "GoldenKey-Prezentaciya.pdf", category: "oferta", description: "Персонална презентация — тотална AI автоматизация за агенция за недвижими имоти. 9 модула: лийдове, разпределение, custom нива, AI CRM, чат за брокери, HR, промотиране, соц.мрежи, поддръжка." },
    ],
  },
];

for (const c of UPLOADS) {
  console.log(`\n=== ${c.name} ===`);
  for (const f of c.files) {
    const r = await uploadPdfFromUrl({ contactId: c.contactId, ...f });
    console.log(`  ${f.filename.padEnd(36)} →`, r.ok ? "✅" : `❌ ${JSON.stringify(r)}`);
  }
}

console.log("\n✅ Авто-качване завършено.");
