# CRM Hermes API

Защитени endpoint-и, които Hermes автоматизациите ползват, за да пишат в CRM-а.
Всички са `POST`, приемат и връщат JSON, и са **idempotent** (повторно извикване не
създава дубликати).

## Автентикация

Всяка заявка трябва да носи:

```
Authorization: Bearer <token>
```

Приема се `HERMES_API_TOKEN` (ако е зададен в env) **или** `INTERNAL_SEND_TOKEN`
(който Hermes вече ползва за `/api/admin/contacts`). Без валиден токен → `403`.

## Idempotency

- **activity** — подай `dedupe_key` (напр. Gmail message id). Същият ключ за същия
  контакт не създава втора бележка.
- **invoice** — дедупликира по `source_email_id`, иначе по `(invoice_number, invoice_type)`,
  иначе по `dedupe_key`.
- **payment** — дедупликира по `source_email_id`, иначе по `dedupe_key`.
- **manual-review** — не създава втори *отворен* item за същия проблем.
- **recurring-service** — upsert по `(contact_id, service_type)`.

Отговорите включват `"created": true|false` — `false` значи „вече съществуваше".

---

## POST /api/crm/activity

Find-or-create контакт + (по избор) idempotent activity + patch на follow-up полета.

```json
{
  "email": "client@firma.bg",
  "full_name": "Иван Иванов",
  "activity_type": "email_sent",
  "title": "Изпратен имейл: оферта",
  "body": "...",
  "occurred_at": "2026-06-04T09:00:00Z",
  "dedupe_key": "gmail:1899abc",
  "followup_status": "sent_offer",
  "next_followup_at": "2026-06-07T09:00:00Z",
  "mark_heard": false,
  "stage": "offer_sent"
}
```

`mark_heard: true` слага `last_heard_from_at = now()` (използва се от „Mark called",
„Asked for feedback" и спира контакта да се води просрочен).
→ `{ "ok": true, "contact_id": "...", "activity_id": "...", "created": true }`

## POST /api/crm/invoice

```json
{
  "client_email": "client@firma.bg",
  "client_name": "Фирма ООД",
  "invoice_number": "1000000123",
  "invoice_type": "invoice",        // invoice|proforma|credit_note|gps_fee|demo_fee|service_fee|other
  "issue_date": "2026-06-01",
  "due_date": "2026-06-15",
  "amount_net": 100, "vat_amount": 20, "amount_gross": 120,
  "currency": "BGN",
  "service_type": "GPS месечен",
  "status": "awaiting_payment",     // по избор; по подразбиране awaiting_payment за не-ръчни
  "source": "gmail_sent",           // manual|gmail_sent|accountant_email|hermes|uploaded_pdf
  "source_email_id": "gmail:1899abc",
  "source_pdf_name": "factura.pdf"
}
```

Резолва `contact_id` по `client_email`. Ако няма контакт → създава `missing_contact`
item за ръчно свързване (за да излезе фактурата в профил).
→ `{ "ok": true, "id": "...", "created": true, "contact_id": "..." }`

## POST /api/crm/payment

Записва плащане (доказателство). **Не** маркира фактура като платена — за това е
`/match-payment`.

```json
{
  "amount": 120, "currency": "BGN",
  "paid_at": "2026-06-05T12:00:00Z",
  "counterparty_name": "ФИРМА ООД",
  "payment_reference_redacted": "...1234",
  "bank_statement_file": "izvlechenie-2026-06.pdf",
  "source": "bank_statement",       // bank_statement|payment_email|manual|hermes
  "source_email_id": "gmail:18aa",
  "invoice_id": null, "contact_id": null
}
```
→ `{ "ok": true, "id": "...", "created": true }`

## POST /api/crm/match-payment

Опитва да засече плащане към фактура. **Правило за сигурност:** никога не маркира
фактура като платена само по сума — нужни са ≥2 независими сигнала И точно 1
кандидат-фактура, иначе отива в ръчна проверка.

```json
{
  "payment_id": "<uuid>",
  "invoice_id": "<uuid>",
  "signals": {
    "name_match": true,
    "invoice_number_match": true,
    "exact_amount_match": true,
    "description_match": false,
    "contact_match": true
  },
  "candidate_invoice_count": 1
}
```
→ auto-match: `{ "ok": true, "decision": "auto_match", "confidence": "high", "invoice_status": "paid", ... }`
→ иначе: `{ "ok": true, "decision": "manual_review", "blockers": ["amount_only"], "manual_review_id": "...", ... }`

## POST /api/crm/manual-review

```json
{
  "type": "payment_match",   // invoice_match|payment_match|missing_contact|ambiguous_pdf|email_parse_error|bank_statement_error|duplicate_invoice|recurring_billing_issue
  "title": "Неясно плащане 240 лв",
  "description": "...",
  "related_contact_id": null, "related_invoice_id": null, "related_payment_id": null,
  "severity": "medium"       // low|medium|high
}
```
→ `{ "ok": true, "id": "...", "created": true }`

## POST /api/crm/recurring-service

```json
{
  "contact_id": "<uuid>",
  "service_type": "gps",      // gps|crm|automation|hosting|maintenance|ads|other
  "amount": 30, "currency": "BGN",
  "billing_period": "monthly", "billing_day": 1,
  "active": true,
  "excluded_from_auto_send": false,
  "excluded_reason": null
}
```

Borima Trans (край след май 2026): `active: false`, `excluded_from_auto_send: true`,
`excluded_reason: "..."` — автоматизацията спира бъдещи GPS фактури, историята остава.
→ `{ "ok": true, "id": "...", "created": true }`

## POST /api/crm/expense

Разход към доставчик (счетоводител, хостинг, реклами, GPS хардуер…).

```json
{
  "supplier_name": "Кръстьо счетоводител",
  "category": "accountant",   // accountant|hosting|ads|gps_hardware|software|office|salary|tax|bank_fee|other
  "invoice_number": "...",
  "amount_net": 100, "vat_amount": 20, "amount_gross": 120,
  "currency": "EUR",
  "expense_date": "2026-06-01", "due_date": "2026-06-15",
  "status": "unpaid",         // unpaid|paid|partially_paid|cancelled
  "source": "accountant_email", "source_email_id": "gmail:...", "contact_id": null
}
```
→ `{ "ok": true, "id": "...", "created": true }`

## POST /api/crm/document

Документ (PDF/снимка/талон/извлечение) + OCR данни, извлечени от Hermes; свързва се
към контакт/фактура/плащане/разход. Несвързаните → ръчна проверка.

```json
{
  "doc_type": "invoice",      // invoice|proforma|receipt|bank_statement|contract|photo|gps_protocol|other
  "title": "Фактура 1000123", "file_name": "factura.pdf",
  "storage_path": "crm-documents/...",
  "ocr_text": "извлечен текст…",
  "extracted": { "invoice_number": "1000123", "amount_gross": 120 },
  "match_confidence": "high", // low|medium|high
  "client_email": "client@firma.bg",  // авто-свързване с контакт
  "invoice_id": null, "payment_id": null, "expense_id": null,
  "source": "hermes", "source_email_id": "gmail:..."
}
```
→ `{ "ok": true, "id": "...", "created": true, "contact_id": "..." }`

## POST /api/crm/meta-ads-report

Сутрешният анализ на рекламите (Hermes го парсва от имейла ти). Upsert по
`(report_date, campaign)`. CPL се смята авто от spend/leads, ако липсва.

```json
{
  "report_date": "2026-06-04", "campaign": "Лийдове · Юни",
  "spend": 100, "leads": 20, "cpl": 5,
  "impressions": 12000, "clicks": 240, "ctr": 2.0, "currency": "EUR",
  "quality_notes": "…", "recommendations": "…", "raw": {}, "source": "hermes"
}
```
→ `{ "ok": true, "id": "...", "created": true }`

## GET /api/crm/accounting-summary  ·  GET /api/crm/sales-summary

Четат обобщения (Bearer). accounting-summary: оборот/плащания/разходи/печалба/неплатени
за текущия месец. sales-summary: pipeline + follow-up състояние.

> **Welcome имейли** се пращат от приложението (Resend · от `ivailo@promarketing.pw` ·
> reply-to `ivailopetev38@gmail.com`) — **НЕ от Hermes**.
