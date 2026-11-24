import { NextResponse } from "next/server";
import { buildFeedIcs, type IcsFeedEvent } from "@/lib/cal/ics";
import { getMemberById } from "@/lib/team/repository";
import { loadCalendar } from "@/lib/team/kalendar";
import { defaultScope, readFeedToken, visibleMeetings, type CalViewer } from "@/lib/team/kalendar-rules";

export const dynamic = "force-dynamic";

/**
 * Личният календар за абонамент: GET /api/ekip/kalendar/<id>.<подпис>.ics
 * Календарните приложения (Google, Apple, Outlook) нямат бисквитки, затова
 * достъпът е по личен подписан линк от страницата „📅 Календар“. Спрян човек
 * (active = false) губи достъпа веднага.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  const { token } = await params;
  const key = secret.length >= 32 ? readFeedToken(decodeURIComponent(token), secret) : null;
  if (!key) return new NextResponse("Not found", { status: 404 });

  let viewer: CalViewer;
  if (key === "owner") {
    viewer = { kind: "owner", id: null, name: "Ивайло", role: "owner" };
  } else {
    const m = await getMemberById(key);
    if (!m || !m.active) return new NextResponse("Not found", { status: 404 });
    viewer = { kind: "member", id: m.id, name: m.full_name, role: m.role };
  }

  const data = await loadCalendar(new Date(), 14, 60);
  const closerIds = new Set(data.closers.map((c) => c.id));
  // Собственикът: само срещите на екипа (своите ги има в календара си). Останалите — както на страницата.
  const all = viewer.kind === "owner" ? data.meetings.filter((m) => m.closerId && closerIds.has(m.closerId)) : data.meetings;
  const mine = visibleMeetings(all, viewer, defaultScope(viewer), closerIds);
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.pw").replace(/\/$/, "");
  const events: IcsFeedEvent[] = mine.map((m) => ({
    uid: `kalendar-${m.id}@promarketing.pw`,
    startISO: m.at,
    minutes: m.minutes,
    summary: `👤 ${m.name}${m.business ? ` (${m.business})` : ""}${m.closer ? ` · води ${m.closer}` : ""}`,
    description: [
      m.closer ? `Води: ${m.closer}` : null,
      m.bookedBy ? `Записа: ${m.bookedBy}` : null,
      m.phone ? `Телефон: ${m.phone}` : null,
      m.meetUrl ? `Meet: ${m.meetUrl}` : null,
      m.status === "completed" ? "✅ проведена" : m.status === "no_show" ? "🙈 не се яви" : null,
      `Календарът на екипа: ${site}/ekip/kalendar`,
    ]
      .filter(Boolean)
      .join("\n"),
    location: m.meetUrl,
    url: m.meetUrl ?? `${site}/ekip/kalendar`,
  }));
  const name = viewer.kind === "member" && viewer.role === "sales" ? "ProMarketing · моите срещи" : "ProMarketing · срещите на екипа";
  return new NextResponse(buildFeedIcs(name, events), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "cache-control": "private, max-age=300",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
