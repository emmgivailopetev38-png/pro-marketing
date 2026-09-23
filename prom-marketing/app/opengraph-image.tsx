// Default OG image for the homepage. Next.js renders this as 1200x630 and
// serves it as `/opengraph-image`. Used automatically by social previews.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ProMarketing LTD — AI автоматизации за бизнеса";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARK =
  "data:image/png;base64,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";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #050813 0%, #0A1329 50%, #060A1A 100%)",
          fontFamily: "Inter, system-ui",
          color: "#fff",
          position: "relative",
        }}
      >
        {/* Cyan glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        {/* Violet glow bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: -200,
            left: -200,
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: "1px solid rgba(6,182,212,0.3)",
            background: "rgba(6,182,212,0.08)",
            padding: "8px 16px",
            borderRadius: 999,
            fontSize: 18,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#06b6d4",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#06b6d4",
              display: "flex",
            }}
          />
          AI · Automation · Growth
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
            marginBottom: 32,
            maxWidth: 1000,
          }}
        >
          <div style={{ display: "flex" }}>Автоматизирай</div>
          <div style={{ display: "flex" }}>
            <span style={{ color: "#06b6d4", display: "flex" }}>бизнеса си</span>
            <span style={{ color: "rgba(255,255,255,0.7)", display: "flex" }}>
              &nbsp;с AI агенти.
            </span>
          </div>
        </div>

        {/* Subline */}
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "rgba(255,255,255,0.7)",
            maxWidth: 900,
            lineHeight: 1.4,
            marginBottom: 48,
          }}
        >
          AI чат агенти, личен AI CRM и софтуер по поръчка — работят 24/7.
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingTop: 32,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* Знакът на марката. Satori не рисува SVG маски, затова тук
                влиза същият знак като PNG с прозрачен фон. */}
            <img src={MARK} width={60} height={60} alt="" />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, display: "flex" }}>
                ProMarketing
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: "rgba(255,255,255,0.5)",
                  display: "flex",
                }}
              >
                promarketing.pw
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <div style={{ display: "flex" }}>
              <span style={{ color: "#22c55e", display: "flex", marginRight: 8 }}>
                12-15ч
              </span>
              спестени седмично
            </div>
            <div style={{ display: "flex" }}>
              <span style={{ color: "#06b6d4", display: "flex", marginRight: 8 }}>
                24/7
              </span>
              AI на смяна
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
