import { renderToBuffer } from "@react-pdf/renderer";
import { TradingBookDocument } from "@/lib/pdf/trading-book-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/trading/kniga
 *
 * Безплатната книга „Трейдинг Агентът — наръчникът” (lead magnet на
 * трейдинг фунията). Линква се от потвърдителния имейл и /trading/blagodaria.
 */
export async function GET() {
  const buffer = await renderToBuffer(<TradingBookDocument />);
  const body = new Uint8Array(buffer);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="ProMarketing-Trading-Agent-Kniga.pdf"',
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
