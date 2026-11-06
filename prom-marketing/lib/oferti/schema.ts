/** Zod схемите на офертите — общи за API-то (Хермес) и за формите в админа и /ekip. */
import { z } from "zod";

export const itemSchema = z.object({
  key: z.string().trim().min(1),
  title: z.string().trim().max(160).optional(),
  subtitle: z.string().max(300).optional(),
  bullets: z.array(z.string().max(300)).max(10).optional(),
  outcome: z.string().max(400).optional(),
  not_included: z.array(z.string().max(200)).max(6).optional(),
  price: z.number().min(0).nullable().optional(),
  unit: z.enum(["еднократно", "/мес"]).optional(),
  setup_price: z.number().min(0).nullable().optional(),
  setup_label: z.string().max(120).optional(),
  qty: z.number().int().positive().max(20).optional(),
  note: z.string().max(400).optional(),
});

export const contentSchema = z
  .object({
    greeting: z.enum(["ti", "vie"]).optional(),
    seller: z.enum(["georgi", "ivailo"]).optional(),
    intro: z.string().max(1200).optional(),
    pain: z.string().max(1200).optional(),
    outcome: z.string().max(600).optional(),
    next_steps: z.array(z.string().max(300)).max(8).optional(),
    terms: z.array(z.string().max(300)).max(10).optional(),
    ps: z.string().max(400).optional(),
  })
  .partial();

export const buildSchema = z.object({
  id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  client_email: z.string().email().optional(),
  client_name: z.string().trim().max(120).optional(),
  client_company: z.string().trim().max(160).optional(),
  template_key: z.string().trim().max(60).optional(),
  items: z.array(itemSchema).max(12).optional(),
  /** кратък вариант: само ключове от каталога */
  moduli: z.array(z.string().trim().min(1)).max(12).optional(),
  greeting: z.enum(["ti", "vie"]).optional(),
  seller: z.enum(["georgi", "ivailo"]).optional(),
  intro: z.string().max(1200).optional(),
  pain: z.string().max(1200).optional(),
  outcome: z.string().max(600).optional(),
  next_steps: z.array(z.string().max(300)).max(8).optional(),
  terms: z.array(z.string().max(300)).max(10).optional(),
  ps: z.string().max(400).optional(),
  discount: z.number().min(0).nullable().optional(),
  discount_note: z.string().max(200).optional(),
  valid_days: z.number().int().min(1).max(90).optional(),
  valid_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  vat_mode: z.enum(["incl", "excl", "none"]).optional(),
  notes: z.string().max(2000).optional(),
  created_by: z.string().trim().max(60).optional(),
});
export type BuildPayload = z.infer<typeof buildSchema>;

export const templateSchema = z.object({
  key: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().max(1000).optional(),
  items: z.array(itemSchema).max(12).optional(),
  content: contentSchema.optional(),
  vat_mode: z.enum(["incl", "excl", "none"]).optional(),
  active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  created_by: z.string().trim().max(60).optional(),
  /** true → връща стандартния вариант от каталога */
  reset: z.boolean().optional(),
});
export type TemplatePayload = z.infer<typeof templateSchema>;

export const sendSchema = z.object({
  id: z.string().uuid(),
  to: z.string().email().optional(),
  subject: z.string().trim().max(200).optional(),
  /** уводът на имейла вместо стандартния; линкът, редовете и подписът се добавят сами */
  text: z.string().max(4000).optional(),
  /** без approved → само preview; с approved=true → тръгва (след изричното „да“ на човека) */
  approved: z.boolean().optional(),
  created_by: z.string().trim().max(60).optional(),
});
