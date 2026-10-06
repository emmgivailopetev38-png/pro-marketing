"use client";
import { useEffect, useMemo, useState } from "react";
import { postJson } from "@/lib/kino/browser";
import { track } from "@/lib/analytics/track";
import { parseLiveUrl, type LiveKind } from "@/lib/kino/live-url";

/**
 * „НА ЖИВО — Ивайло влезе. Включи се“. Ивайло го включва от Режисьорската
 * кабина (/admin/kino) с линк към Zoom / Google Meet / YouTube Live; залата
 * пита на ~25 s. По подразбиране е изключено — тогава тук няма нищо.
 */

export interface LiveInfo {
  on: boolean;
  url?: string;
  kind?: LiveKind;
  youtubeId?: string | null;
  label?: string;
}

const POLL_MS = 25_000;

export function useKinoLive({
  token,
  enabled,
  preview,
  simUrl,
}: {
  token: string | null;
  enabled: boolean;
  preview: boolean;
  /** прегледът: ?live=<линк> показва бутона, без да пипа кабината */
  simUrl?: string | null;
}): LiveInfo {
  const sim = useMemo(() => parseLiveUrl(simUrl), [simUrl]);
  const [live, setLive] = useState<LiveInfo>({ on: false });

  useEffect(() => {
    if (sim || !enabled || (!token && !preview)) return;
    let stopped = false;
    const ask = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/kino/live${token ? `?t=${encodeURIComponent(token)}` : ""}`, { cache: "no-store" });
        const data = (await res.json()) as LiveInfo;
        if (!stopped) setLive(data.on && data.url ? data : { on: false });
      } catch {
        /* мрежата — пак след малко */
      }
    };
    void ask();
    const id = window.setInterval(ask, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void ask();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stopped = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [sim, enabled, token, preview]);

  if (sim) return { on: true, url: sim.url, kind: sim.kind, youtubeId: sim.youtubeId, label: sim.label };
  return enabled ? live : { on: false };
}

export function LiveJoin({ live, token, pos }: { live: LiveInfo; token: string | null; pos: () => number }) {
  if (!live.on || !live.url) return null;
  const onClick = () => {
    track("kino_live_join", { kind: live.kind ?? "link" });
    if (token) void postJson("/api/kino/track", { k: "ev", t: token, type: "click", value: "live", pos: Math.round(pos()) });
  };
  return (
    <div className="k-live" role="status" aria-live="polite">
      <a className="k-btn k-live-btn" href={live.url} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        <span className="k-live-dot" aria-hidden="true" /> НА ЖИВО — Ивайло влезе. Включи се
      </a>
      {live.kind === "youtube" && live.youtubeId ? (
        <div className="k-screen k-live-embed">
          <iframe
            src={`https://www.youtube.com/embed/${live.youtubeId}?playsinline=1&rel=0`}
            title="Ивайло на живо"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="k-muted" style={{ margin: "8px 0 0", fontSize: "0.88rem" }}>
          Отваря {live.label ?? "срещата"} в нов таб — залата остава отворена тук.
        </p>
      )}
    </div>
  );
}
