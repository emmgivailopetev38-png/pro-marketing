import { ImageResponse } from "next/og";
import { KINO } from "@/lib/kino/config";
import { premiereLabels } from "@/lib/kino/time";
import { seatFor } from "@/lib/kino/people";
import { contactFromTicket } from "@/lib/kino/token";
import { getContact } from "@/lib/kino/server";
import { kinoFonts } from "@/lib/kino/og-fonts";

export const dynamic = "force-dynamic";

/**
 * GET /api/kino/ticket?t=… — личният кино билет като картинка (1200×630):
 * за сваляне, за Stories и за прегледа, когато някой сподели линка.
 * Без билет — общ „Гост на премиерата“.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const t = url.searchParams.get("t");
  const contactId = t ? contactFromTicket(t) : null;
  const contact = contactId ? await getContact(contactId) : null;
  const name = (contact?.full_name ?? "").trim() || (contactId ? "Зрител" : "Гост на премиерата");
  const seat = contactId ? seatFor(contactId) : { hall: 1, row: 7, seat: 12 };
  const labels = premiereLabels();
  const code = (t ?? "VALNATA").slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "X");
  const fonts = await kinoFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 0%, #2a1650 0%, #0b0a1c 45%, #05050c 100%)",
          fontFamily: "Noto Sans",
        }}
      >
        <div
          style={{
            width: 1080,
            height: 500,
            display: "flex",
            borderRadius: 34,
            background: "linear-gradient(135deg, #12112a 0%, #0c0b1d 60%, #160f2b 100%)",
            border: "2px solid rgba(168,85,247,0.45)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* лъчът на прожектора */}
          <div
            style={{
              position: "absolute",
              top: -180,
              left: 120,
              width: 620,
              height: 620,
              borderRadius: 620,
              background: "radial-gradient(circle, rgba(34,211,238,0.20) 0%, rgba(168,85,247,0.08) 45%, rgba(0,0,0,0) 70%)",
              display: "flex",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "46px 56px", width: 790 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: "#22d3ee", fontWeight: 700 }}>ОНЛАЙН ПРЕМИЕРА · БИЛЕТ</div>
              <div style={{ display: "flex", fontSize: 118, fontWeight: 700, letterSpacing: 14, color: "#f5f7ff", marginTop: 6, lineHeight: 1.05 }}>
                {KINO.title}
              </div>
              <div style={{ display: "flex", height: 6, width: 520, borderRadius: 6, marginTop: 10, background: "linear-gradient(90deg, #22d3ee, #a855f7, #ec4899)" }} />
              <div style={{ display: "flex", fontSize: 24, color: "#b7bdd8", marginTop: 18 }}>{KINO.subtitle}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 18, letterSpacing: 4, color: "#8b90b0" }}>НА ИМЕТО НА</div>
              <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#ffffff", marginTop: 2 }}>{name.slice(0, 34)}</div>
              <div style={{ display: "flex", fontSize: 24, color: "#e9d5ff", marginTop: 10 }}>
                {`${labels.day} · ${labels.time}`}
              </div>
            </div>
          </div>
          {/* перфорацията */}
          <div style={{ display: "flex", position: "absolute", left: 790, top: -22, width: 44, height: 44, borderRadius: 44, background: "#08070f" }} />
          <div style={{ display: "flex", position: "absolute", left: 790, bottom: -22, width: 44, height: 44, borderRadius: 44, background: "#08070f" }} />
          <div style={{ display: "flex", position: "absolute", left: 811, top: 34, bottom: 34, width: 0, borderLeft: "3px dashed rgba(168,85,247,0.5)" }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 290,
              paddingLeft: 30,
              color: "#f5f7ff",
            }}
          >
            <div style={{ display: "flex", fontSize: 20, letterSpacing: 5, color: "#8b90b0" }}>ЗАЛА</div>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 700 }}>{seat.hall}</div>
            <div style={{ display: "flex", gap: 26, marginTop: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", fontSize: 18, letterSpacing: 4, color: "#8b90b0" }}>РЕД</div>
                <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: "#22d3ee" }}>{seat.row}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", fontSize: 18, letterSpacing: 4, color: "#8b90b0" }}>МЯСТО</div>
                <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: "#ec4899" }}>{seat.seat}</div>
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 18, color: "#8b90b0", marginTop: 26, letterSpacing: 3 }}>{`№ ${code}`}</div>
            <div style={{ display: "flex", fontSize: 18, color: "#c4b5fd", marginTop: 6 }}>Вход свободен</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
      headers: { "cache-control": contactId ? "private, max-age=600" : "public, max-age=3600" },
    },
  );
}
