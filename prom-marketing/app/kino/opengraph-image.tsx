import { ImageResponse } from "next/og";
import { KINO } from "@/lib/kino/config";
import { premiereLabels } from "@/lib/kino/time";
import { kinoFonts } from "@/lib/kino/og-fonts";

// Картинката при споделяне на афиша (Viber, Facebook, Messenger) — плакат.
export const alt = `${KINO.title} · онлайн премиера`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const when = premiereLabels();
  const fonts = await kinoFonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "70px 80px",
          background: "radial-gradient(ellipse at 50% 0%, #2b1556 0%, #0b0a1c 50%, #05050c 100%)",
          color: "#f5f3ff",
          fontFamily: "Noto Sans",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -260,
            left: 300,
            width: 700,
            height: 700,
            borderRadius: 700,
            background: "radial-gradient(circle, rgba(34,211,238,0.22) 0%, rgba(168,85,247,0.1) 45%, rgba(0,0,0,0) 70%)",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 8, color: "#22d3ee", fontWeight: 700 }}>ОНЛАЙН ПРЕМИЕРА · ВХОД СВОБОДЕН</div>
        <div style={{ display: "flex", fontSize: 168, fontWeight: 700, letterSpacing: 20, lineHeight: 1.05, marginTop: 10 }}>{KINO.title}</div>
        <div style={{ display: "flex", height: 8, width: 620, borderRadius: 8, background: "linear-gradient(90deg, #22d3ee, #a855f7, #ec4899)" }} />
        <div style={{ display: "flex", fontSize: 34, color: "#d8d4f2", marginTop: 26 }}>{KINO.subtitle}</div>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700, marginTop: 22, color: "#ffffff" }}>
          {`${when.day} · ${when.time}`}
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#9a96bd", marginTop: 26 }}>
          Целият филм е направен с AI — дори гласът · Ивайло Петев, Pro Marketing
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
