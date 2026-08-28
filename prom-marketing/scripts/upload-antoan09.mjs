#!/usr/bin/env node
const TOKEN = "d57f2e068ec50e6ebccc5e98dbf9a9189a2fbaa238b22354036250334a57872e";
const HOST = "https://promarketing.pw";
const VALENTIN_ID = "4d3080cc-501b-49c6-a6f8-5619213a24d1";

const pdfRes = await fetch(`${HOST}/api/oferta/antoan09/pdf?v=${Date.now()}`);
const blob = await pdfRes.blob();

const fd = new FormData();
fd.append("file", new File([blob], "Antoan09-Oferta-1800EUR.pdf", { type: "application/pdf" }));
fd.append("category", "oferta");
fd.append("description", "Финална оферта за Antoan 09 EOOD · 1 800 € · 30-45 дни · QR + AI Vision + авто-протоколи + 3 вида обслужване tracking + Telegram + опция за multilingual AI чат за чужбина.");
fd.append("uploaded_by", "emmgivailopetev38@gmail.com");

const up = await fetch(`${HOST}/api/admin/contacts/${VALENTIN_ID}/files`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}` },
  body: fd,
});
console.log(await up.json());
