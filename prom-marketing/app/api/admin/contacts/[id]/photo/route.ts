import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/session";
import { checkHermesAuth } from "@/lib/crm/auth";
import {
  MAX_PHOTO_BYTES,
  fetchPhotoFromUrl,
  photoSrc,
  removeContactPhoto,
  storeContactPhoto,
} from "@/lib/contacts/dnevnik-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Снимката на картона.
 *
 * POST multipart {file}            — качване от телефона/компютъра
 * POST json {url, source?, note?}  — сваля снимка от адрес (профил, сайт,
 *                                    кадър от Fathom) и я пази в бъкета
 * DELETE                           — маха снимката
 *
 * Вход: бисквитката на админа ИЛИ Bearer на Хермес (за скриптове).
 */
async function isAuthed(request: Request): Promise<boolean> {
  if (checkHermesAuth(request)) return true;
  const store = await cookies();
  return verifySession(store.get(ADMIN_COOKIE)?.value ?? null);
}

function actorOf(request: Request): string {
  return checkHermesAuth(request) ? "hermes" : process.env.ADMIN_ACTOR || "Ивайло";
}

function revalidate(id: string) {
  revalidatePath(`/admin/clients/${id}`);
  revalidatePath("/admin/follow-up");
  revalidatePath("/admin/clients");
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed(request))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { createServiceClient } = await import("@/lib/supabase/service");
  const { data } = await createServiceClient().from("contacts").select("photo_url, photo_source, photo_updated_at").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ src: await photoSrc(data.photo_url), source: data.photo_source, updated_at: data.photo_updated_at });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed(request))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const actor = actorOf(request);
  const ctype = request.headers.get("content-type") ?? "";

  let buf: Buffer;
  let mime: string;
  let source: "upload" | "url" | "fathom" = "upload";
  let note: string | null = null;

  if (ctype.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Липсва файл" }, { status: 400 });
    if (file.size > MAX_PHOTO_BYTES) return NextResponse.json({ error: "Снимката е над 10 MB" }, { status: 413 });
    buf = Buffer.from(await file.arrayBuffer());
    mime = (file.type || "").toLowerCase();
    note = String(form?.get("note") ?? "").trim() || null;
  } else {
    const body = (await request.json().catch(() => null)) as { url?: string; source?: string; note?: string } | null;
    if (!body?.url) return NextResponse.json({ error: "Липсва url" }, { status: 400 });
    const got = await fetchPhotoFromUrl(body.url);
    if ("error" in got) return NextResponse.json({ error: got.error }, { status: 400 });
    buf = got.buf;
    mime = got.mime;
    source = body.source === "fathom" ? "fathom" : "url";
    note = body.note?.trim() || null;
  }

  const stored = await storeContactPhoto({ contactId: id, buf, mime, source, actor, note });
  if (!stored.ok) return NextResponse.json({ error: stored.error }, { status: 400 });
  revalidate(id);
  return NextResponse.json({ ok: true, path: stored.path, src: await photoSrc(stored.path) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed(request))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { error } = await removeContactPhoto(id);
  if (error) return NextResponse.json({ error }, { status: 400 });
  revalidate(id);
  return NextResponse.json({ ok: true });
}
