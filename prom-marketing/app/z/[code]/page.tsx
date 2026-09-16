import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { contactIdForCode } from "@/lib/contacts/personal-link";
import { firstName } from "@/lib/email/sequence-layout";
import { toE164 } from "@/lib/cal/create-booking";
import { BookingEmbed } from "@/components/booking/BookingEmbed";
import { ZatopliViewTracker } from "./tracker";

export const dynamic = "force-dynamic";

/**
 * Личната страница на един лийд.
 *
 * Един линк от съобщението, и човекът е тук — разпознат, без да е писал нищо.
 * Няма форма, няма „оставете вашите данни": календарът излиза с попълнени име,
 * имейл и телефон, защото всяко поле по пътя към часа яде срещи.
 *
 * Страницата е лична, затова не се индексира и не се кешира.
 */
export const metadata: Metadata = {
  title: "Твоят час",
  robots: { index: false, follow: false },
};

interface Contact {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
}

export default async function PersonalPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const sb = createServiceClient();
  const { data: ids } = await sb.from("contacts").select("id");
  const contactId = contactIdForCode(code, ((ids ?? []) as Array<{ id: string }>).map((r) => r.id));
  if (!contactId) notFound();

  const { data } = await sb
    .from("contacts")
    .select("id, full_name, email, phone, company")
    .eq("id", contactId)
    .maybeSingle();
  const contact = data as Contact | null;
  if (!contact) notFound();

  const name = firstName(contact.full_name);
  // Плейсхолдърът от гласовия агент не бива да влиза в календара като имейл.
  const email = contact.email && !contact.email.startsWith("bez-imeil@") ? contact.email : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030308] text-[#f5f7ff]">
      <ZatopliViewTracker code={code} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6, 182, 212, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 15% 20%, rgba(6, 182, 212, 0.10) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(124, 58, 237, 0.08) 0%, transparent 45%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-24">
        <div className="text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-cyan-300">
            ProMarketing
          </p>
          <h1 className="font-display text-[clamp(32px,6vw,60px)] font-extrabold leading-[1.02]">
            {name ? (
              <>
                {name}, <span className="text-cyan-300">избери си час</span>
              </>
            ) : (
              <>
                Избери си <span className="text-cyan-300">час</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#a5b0c8]">
            Петнайсет минути на екран. Показвам ти какво конкретно бих направил
            {contact.company ? ` при ${contact.company}` : " при теб"} — рекламите, запитванията и
            какво се случва с тях, след като влязат. Излизаш с план, независимо дали работим заедно.
          </p>
        </div>

        {/* Гласовият агент — за човека, който предпочита да чуе, вместо да чете */}
        <div className="mt-10 rounded-2xl border border-violet-500/20 bg-[#0a0a1f]/60 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-lg font-bold">Или просто питай на глас</p>
              <p className="mt-1 text-sm leading-relaxed text-[#a5b0c8]">
                Коста вдига веднага, отговаря на въпросите ти и записва часа, докато си на линията.
              </p>
            </div>
            <Link
              href="/?glas=1"
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-violet-400/40 px-5 py-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/10"
            >
              🎙️ Говори с Коста
            </Link>
          </div>
        </div>

        {/* Календарът — попълнен, защото вече знаем кой е */}
        <div className="mt-6 rounded-2xl border border-cyan-500/15 bg-[#0a0a1f]/60 p-2 md:p-4">
          <BookingEmbed
            prefill={{ name: contact.full_name, email, phone: toE164(contact.phone) }}
          />
        </div>

        <div className="mt-8 text-center text-sm text-[#7a8699]">
          <p>
            Ако предпочиташ направо —{" "}
            <a href="tel:+359877399963" className="text-cyan-300 transition hover:text-cyan-200">
              0877 399 963
            </a>{" "}
            или пиши на{" "}
            <a
              href="mailto:emmgivailopetev38@gmail.com"
              className="text-cyan-300 transition hover:text-cyan-200"
            >
              emmgivailopetev38@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
