import { renderToBuffer } from "@react-pdf/renderer";
import { WebinarBuilderDocument } from "@/lib/pdf/webinar-builder-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/webinar/podarak-2
 *
 * Бонус презентацията „AI Строител — бърз наръчник” (втори подарък при
 * записване): AI агент, реклами с глас, трейдинг агент (образователно,
 * с дисклеймър), дашборд/сайт с код. Линква се от потвърдителния имейл.
 */
export async function GET() {
  const buffer = await renderToBuffer(<WebinarBuilderDocument />);
  const body = new Uint8Array(buffer);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="ProMarketing-AI-Stroitel.pdf"',
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
