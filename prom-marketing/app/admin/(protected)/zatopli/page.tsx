import { createServiceClient } from "@/lib/supabase/service";
import type { ContactRow } from "@/lib/contacts/types";
import { warmthOf, compareWarmth, SIGNAL_TYPES } from "@/lib/contacts/warmth";
import { personalLinkFor, isPersonalLinkConfigured } from "@/lib/contacts/personal-link";
import { ZatopliQueue, type ZatopliRow } from "@/components/admin/ZatopliQueue";

export const dynamic = "force-dynamic";

/**
 * Опашката „Затопли".
 *
 * Отговаря на един въпрос: с кои двайсет души да се захвана сега. Досега
 * отговорът идваше от календара (`next_followup_at`), затова 157 контакта без
 * обещание не се виждаха никъде — те нямат просрочена дата, значи не изплуват.
 * Тук редът е по това какво е направил ЧОВЕКЪТ, не какво сме обещали ние.
 */

/**
 * Активностите, които значат „ние сме го докоснали".
 *
 * Входът на лийда (`meta_lead`, `website_form`) нарочно не е тук — човекът,
 * който е оставил данни и не е чул нищо от нас, е недокоснат, а не студен.
 */
const OUTREACH_TYPES = [
  "email_sent",
  "gmail_sent",
  "call",
  "meeting",
  "offer_sent",
  "presentation_sent",
  "proforma_sent",
  "contract_sent",
  "viber_sent",
  "whatsapp_sent",
  "telegram_sent",
];

/** Съобщенията по месинджър — за да не пишем на един и същ човек два пъти в седмицата. */
const MESSENGER_TYPES = ["viber_sent", "whatsapp_sent", "telegram_sent"];

export default async function ZatopliPage() {
  const sb = createServiceClient();

  const [{ data: contacts }, { data: acts }] = await Promise.all([
    sb
      .from("contacts")
      .select("*")
      .not("stage", "in", "(won,lost)")
      .order("created_at", { ascending: false }),
    sb
      .from("contact_activities")
      .select("contact_id, activity_type, occurred_at")
      .in("activity_type", [...new Set([...SIGNAL_TYPES, ...OUTREACH_TYPES])])
      .order("occurred_at", { ascending: false }),
  ]);

  const allContacts = (contacts ?? []) as ContactRow[];
  const activities = (acts ?? []) as Array<{
    contact_id: string;
    activity_type: string;
    occurred_at: string;
  }>;

  // Един проход през активностите — сигналите, докосванията и последното
  // съобщение по месинджър, групирани по контакт.
  const byContact = new Map<
    string,
    { signals: Array<{ activity_type: string; occurred_at: string }>; touched: boolean; lastMessaged: string | null }
  >();

  for (const a of activities) {
    let e = byContact.get(a.contact_id);
    if (!e) {
      e = { signals: [], touched: false, lastMessaged: null };
      byContact.set(a.contact_id, e);
    }
    if (SIGNAL_TYPES.includes(a.activity_type)) {
      e.signals.push({ activity_type: a.activity_type, occurred_at: a.occurred_at });
    }
    if (OUTREACH_TYPES.includes(a.activity_type)) e.touched = true;
    if (MESSENGER_TYPES.includes(a.activity_type) && !e.lastMessaged) {
      // Активностите идват подредени низходящо — първата е последната по време.
      e.lastMessaged = a.occurred_at;
    }
  }

  const rows: ZatopliRow[] = allContacts
    .map((c) => {
      const e = byContact.get(c.id);
      return {
        ...c,
        warmth: warmthOf(e?.signals ?? [], { touched: e?.touched ?? false }),
        link: personalLinkFor(c.id),
        last_messaged_at: e?.lastMessaged ?? null,
      };
    })
    .sort((a, b) => compareWarmth(a.warmth, b.warmth));

  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Продажби</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Затопли</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Подредени по това какво е направил човекът, не по календара. Топлите се звънят, останалите
            получават съобщение с личен линк — един клик отваря чата с готовия текст.
          </p>
          {!isPersonalLinkConfigured() && (
            <p className="mt-3 rounded-lg border border-[rgba(251,146,60,0.4)] bg-[rgba(251,146,60,0.08)] p-3 text-xs text-[var(--color-text-secondary)]">
              ⚠️ Личните линкове са изключени — липсва <code>ZATOPLI_LINK_SECRET</code> и{" "}
              <code>INTERNAL_SEND_TOKEN</code> във Vercel. Съобщенията се сглобяват без линк.
            </p>
          )}
        </header>

        <ZatopliQueue rows={rows} />
      </div>
    </div>
  );
}
