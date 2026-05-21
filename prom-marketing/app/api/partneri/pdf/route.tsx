import { renderToBuffer } from "@react-pdf/renderer";
import { PartneriDocument } from "@/lib/pdf/partneri-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/partneri/pdf
 *
 * Streams the partner one-pager as an A4 PDF. Same content as /partneri.
 * Render cost is ~1-2s on first hit; subsequent hits hit Vercel's edge cache
 * via the Cache-Control header below.
 */
export async function GET() {
  const buffer = await renderToBuffer(<PartneriDocument />);
  // Convert Buffer to Uint8Array for a portable Response body.
  const body = new Uint8Array(buffer);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'inline; filename="ProMarketing-Partneri.pdf"',
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
