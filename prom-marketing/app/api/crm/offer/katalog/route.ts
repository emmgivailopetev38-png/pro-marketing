import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { GROUP_LABEL, MODULES, SELLERS, VAT_MODE_LABEL } from "@/lib/oferti/katalog";
import { listTemplates } from "@/lib/oferti/repository";
import { fmtEur } from "@/lib/oferti/smetki";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/offer/katalog — модулите, от които се сглобява оферта, и
 * примерните шаблони. За асистентите (Хермес) и за билдъра в админа.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const templates = await listTemplates(false).catch(() => []);
  return NextResponse.json({
    ok: true,
    groups: GROUP_LABEL,
    modules: MODULES.map((m) => ({
      key: m.key,
      group: m.group,
      title: m.title,
      subtitle: m.subtitle,
      price: m.price,
      price_text: m.price === null ? "цената я дава Ивайло" : `${fmtEur(m.price)} ${m.unit}${m.setup_price ? ` + ${fmtEur(m.setup_price)} ${m.setup_label ?? "внедряване"}` : ""}`,
      unit: m.unit,
      setup_price: m.setup_price ?? null,
      needs_price: Boolean(m.needs_price),
      bullets: m.bullets,
      outcome: m.outcome ?? null,
      not_included: m.not_included ?? [],
      installments: m.installments ?? [],
      za_prodavacha: m.za_prodavacha ?? null,
    })),
    templates: templates.map((t) => ({
      key: t.key,
      name: t.name,
      description: t.description,
      items: t.items.map((i) => ({ key: i.key, title: i.title, price: i.price, unit: i.unit, setup_price: i.setup_price ?? null })),
      vat_mode: t.vat_mode,
    })),
    sellers: Object.values(SELLERS).map((s) => ({ key: s.key, name: s.name, phone: s.phone })),
    vat_modes: VAT_MODE_LABEL,
    pravila: [
      "Един човек — един пакет: избира се нивото според човека, не се изреждат три цени.",
      "Цените са от стълбата (06.11.2026) и са с ДДС. Модул без цена (маркетинг, автоматизация по мярка, сайт, друго) влиза само с цена от Ивайло.",
      "Отстъпка — само срещу размяна (плащане накуп, видеоотзив, две препоръки) и само с „да“ от Ивайло; иначе се сваля обхватът, не цената.",
      "Офертата се прави като чернова, показва се на продавача (линк + PDF) и тръгва по имейл чак след изричното му „да“.",
    ],
  });
}
