import { buildIcs } from "@/lib/kino/ics";
import { premiereEvent } from "@/lib/kino/calendar";
import { contactFromTicket } from "@/lib/kino/token";
import { KINO } from "@/lib/kino/config";

export const dynamic = "force-dynamic";

/**
 * GET /api/kino/ics?t=… — „Добави в календара“ (Apple, Outlook, всякакви).
 * С билет — в описанието е личният линк към залата; без — афишът.
 */
export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get("t");
  const hall = t && contactFromTicket(t) ? `${KINO.site}/k/${t}` : null;
  const ics = buildIcs(premiereEvent(hall));
  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="valnata-premiera.ics"`,
      "cache-control": "private, max-age=300",
    },
  });
}
