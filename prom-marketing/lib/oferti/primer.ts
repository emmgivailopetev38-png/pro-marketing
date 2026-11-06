import type { OfferTemplate } from "./katalog";
import { buildItems } from "./smetki";
import { viewModel, type OfferFull, type OfferView } from "./view";

/** Примерна оферта от шаблон — с измислен клиент, за да се види как изглежда PDF-ът. */
export function sampleView(t: OfferTemplate, seller: "georgi" | "ivailo" = "ivailo"): OfferView {
  const items = buildItems(t.items.map((i) => ({ ...i, price: i.price ?? 0 }))).items.map((i, idx) => ({
    ...i,
    price: t.items[idx]?.price ?? null,
  }));
  const now = new Date();
  const valid = new Date(now.getTime() + 14 * 86_400_000).toISOString().slice(0, 10);
  const offer: OfferFull = {
    id: "00000000-0000-0000-0000-000000000000",
    number: 0,
    token: "primer",
    contact_id: null,
    title: items.map((i) => i.title).join(" + ") || t.name,
    description: null,
    status: "draft",
    amount_net: null,
    amount_gross: null,
    vat_amount: null,
    currency: "EUR",
    sent_at: null,
    valid_until: valid,
    accepted_at: null,
    url: null,
    source: "primer",
    notes: null,
    template_key: t.key,
    items,
    content: {
      greeting: t.content.greeting ?? "ti",
      seller,
      client_name: "Иван Примеров",
      client_company: "Примерна фирма ЕООД",
      intro: t.content.intro,
      pain: t.content.pain ?? "„Запитванията идват, но не успявам да звънна на всички и половината се губят.“",
      outcome: t.content.outcome,
      ps: t.content.ps,
      next_steps: t.content.next_steps ?? [],
      terms: t.content.terms ?? [],
    },
    discount: null,
    discount_note: null,
    vat_mode: t.vat_mode,
    owner_id: null,
    created_by: "primer",
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    contact: null,
  };
  return viewModel(offer);
}
