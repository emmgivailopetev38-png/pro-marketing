import { renderToBuffer } from "@react-pdf/renderer";
import { WebinarGiftDocument } from "@/lib/pdf/webinar-gift-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/webinar/podarak
 *
 * Стриймва „AI Стартов Пакет" (lead magnet-а на уебинар фунията) като A4 PDF.
 * Линква се от потвърдителния имейл и от /webinar/registriran.
 */
export async function GET() {
  const buffer = await renderToBuffer(<WebinarGiftDocument />);
  const body = new Uint8Array(buffer);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="ProMarketing-AI-Startov-Paket.pdf"',
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
