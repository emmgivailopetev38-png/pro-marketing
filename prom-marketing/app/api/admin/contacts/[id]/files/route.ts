import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "contact-files";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

function checkBearer(request: Request): boolean {
  const expected = process.env.INTERNAL_SEND_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  const provided = header.slice(7);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function isAuthed(request: Request): Promise<boolean> {
  if (checkBearer(request)) return true;
  const store = await cookies();
  return verifySession(store.get(ADMIN_COOKIE)?.value ?? null);
}

// GET — list files for a contact
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("contact_files")
    .select("*")
    .eq("contact_id", id)
    .order("uploaded_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ files: data ?? [] });
}

// POST — upload a new file (multipart/form-data)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "No form data" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 });
  }

  const category = (form.get("category") as string) || "other";
  const description = (form.get("description") as string) || null;
  const uploadedBy = (form.get("uploaded_by") as string) || "ivailopetev38@gmail.com";

  const sb = createServiceClient();

  // Generate unique storage path: contact_id/timestamp_sanitizedFilename
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${id}/${Date.now()}_${safeName}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await sb.storage
    .from(BUCKET)
    .upload(storagePath, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json({ error: `upload: ${upErr.message}` }, { status: 500 });
  }

  const { data: row, error: insErr } = await sb
    .from("contact_files")
    .insert({
      contact_id: id,
      filename: file.name,
      storage_path: storagePath,
      size_bytes: file.size,
      mime_type: file.type || null,
      category,
      description,
      uploaded_by: uploadedBy,
    })
    .select()
    .single();

  if (insErr) {
    // Cleanup uploaded blob if metadata insert failed.
    await sb.storage.from(BUCKET).remove([storagePath]).catch(() => null);
    return NextResponse.json({ error: `metadata: ${insErr.message}` }, { status: 500 });
  }

  // Also log an activity so it shows in the timeline.
  await sb.from("contact_activities").insert({
    contact_id: id,
    activity_type: "note",
    title: `📎 Качен файл: ${file.name}`,
    body: description || `Категория: ${category}, размер: ${Math.round(file.size / 1024)} KB`,
    occurred_at: new Date().toISOString(),
    created_by: uploadedBy,
    metadata: { contact_file_id: row.id, filename: file.name, category },
  });

  return NextResponse.json({ ok: true, file: row });
}
