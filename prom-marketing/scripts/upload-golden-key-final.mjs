#!/usr/bin/env node
// Качва финалната Golden Key презентация v2 (с 3 нива + месечни разходи + документи модул)
// в архива на Росен Костадинов.

const TOKEN = "d57f2e068ec50e6ebccc5e98dbf9a9189a2fbaa238b22354036250334a57872e";
const HOST = "https://promarketing.pw";
const ROSEN_ID = "c273d183-93d6-4a06-98fb-13fe851fc9fc";

async function uploadPdf({ pdfUrl, filename, category, description }) {
  const pdfRes = await fetch(`${HOST}${pdfUrl}?v=${Date.now()}`);
  if (!pdfRes.ok) return { error: `download failed: ${pdfRes.status}` };
  const blob = await pdfRes.blob();

  const fd = new FormData();
  fd.append("file", new File([blob], filename, { type: "application/pdf" }));
  fd.append("category", category);
  fd.append("description", description);
  fd.append("uploaded_by", "emmgivailopetev38@gmail.com");

  const up = await fetch(`${HOST}/api/admin/contacts/${ROSEN_ID}/files`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${TOKEN}` },
    body: fd,
  });
  return up.json();
}

console.log("📤 Качвам Golden Key v2 PDF в архива на Росен...");
const result = await uploadPdf({
  pdfUrl: "/api/oferta/golden-key/pdf",
  filename: "GoldenKey-Oferta-v2-FINAL.pdf",
  category: "oferta",
  description: "Финална оферта v2 (след дискавъри 27.05). Включва: 9 модула, 11 визуални mockups, 3 нива (3800/4900/6000€), ежемесечни разходи (поддръжка 300-400€ + Supabase 30-60€), GDPR security. Документи модул вместо чат за брокери.",
});
console.log("Резултат:", result);
