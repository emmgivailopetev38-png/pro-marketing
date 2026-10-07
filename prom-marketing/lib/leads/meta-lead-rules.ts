/**
 * Входът на Meta лийда — чистите правила (без база, без "server-only"), за да
 * се тестват. Самият вход е в app/api/webhooks/meta-leads/route.ts.
 *
 *   • откъде е дошъл: кампания, ад сет, реклама, форма — всичко с id И име,
 *     за да се брои после по кампания (цена на лийд / среща / клиент);
 *   • какво е поискал (наръчник, курс, AI одит… — lead-offers.ts);
 *   • кое писмо с материала му се полага, ако формата е лийд магнит.
 */
import { firstStepForForm } from "@/lib/email/lead-steps";
import type { SequenceStep } from "@/lib/email/sequence-layout";
import { LEAD_OFFERS, offerFor, type OfferKey } from "./lead-offers";

export interface MetaLeadDetailLite {
  id: string;
  created_time?: string | null;
  ad_id?: string | null;
  ad_name?: string | null;
  adset_id?: string | null;
  adset_name?: string | null;
  campaign_id?: string | null;
  campaign_name?: string | null;
  form_id?: string | null;
}

export interface LeadAttribution {
  meta_lead_id: string;
  form_id: string | null;
  form_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
  /** какво е поискал — ключ от lead-offers.ts */
  offer: OfferKey | null;
  /** лийд магнитът по формата (вариантът на първото писмо), ако е такъв */
  magnet: string | null;
}

function s(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t ? t : null;
}

/** Вариантът на лийд магнита за тази форма — null, ако формата не е магнит. */
export function magnetVariantFor(formId: string | null | undefined): string | null {
  return firstStepForForm(formId).variant ?? null;
}

/** Откъде е дошъл лийдът — това влиза в metadata на активността `meta_lead`. */
export function leadAttribution(
  detail: MetaLeadDetailLite,
  opts: { formId?: string | null; formName?: string | null } = {}
): LeadAttribution {
  const formId = s(detail.form_id) ?? s(opts.formId);
  const formName = s(opts.formName);
  const magnet = magnetVariantFor(formId);
  return {
    meta_lead_id: detail.id,
    form_id: formId,
    form_name: formName,
    campaign_id: s(detail.campaign_id),
    campaign_name: s(detail.campaign_name),
    adset_id: s(detail.adset_id),
    adset_name: s(detail.adset_name),
    ad_id: s(detail.ad_id),
    ad_name: s(detail.ad_name),
    offer: offerFor({ magnetVariant: magnet, formName, campaignName: detail.campaign_name, source: "meta_lead" }),
    magnet,
  };
}

/** Тялото на активността `meta_lead`: какво е поискал и откъде — четимо в картона. */
export function attributionBody(a: LeadAttribution): string {
  const lines = [
    a.offer ? `Поиска: ${LEAD_OFFERS[a.offer].label}` : null,
    a.ad_name ? `Реклама: ${a.ad_name}` : null,
    a.adset_name ? `Ад сет: ${a.adset_name}` : null,
    a.form_name ? `Форма: ${a.form_name}` : a.form_id ? `Форма: ${a.form_id}` : null,
  ].filter((l): l is string => !!l);
  return lines.join("\n");
}

/**
 * Писмото с материала за лийд магнит.
 *
 * Нов картон → първата стъпка на поредицата, както досега (ключ `s1_lichno`,
 * за да не прати кронът отгоре и демотата). Картон, който вече го има (човекът
 * е оставял данни и преди) → същото писмо с отделен ключ `magnit_<вариант>`:
 * поредицата му си върви, а материалът, който е поискал СЕГА, пак стига до
 * него. Форма, която не е магнит → null (старите картони не получават нищо).
 */
export function magnetStepFor(formId: string | null | undefined, isNewContact: boolean): SequenceStep | null {
  const step = firstStepForForm(formId);
  if (!step.variant) return null;
  return isNewContact ? step : { ...step, key: `magnit_${step.variant}` };
}
