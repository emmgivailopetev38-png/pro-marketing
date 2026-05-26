import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "contact-files";

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

// GET — download a file (returns the file blob with proper headers)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; file_id: string }> }
) {
  if (!(await isAuthed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, file_id } = await params;

  const sb = createServiceClient();
  const { data: row, error } = await sb
    .from("contact_files")
    .select("*")
    .eq("id", file_id)
    .eq("contact_id", id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { data: blob, error: dlErr } = await sb.storage
    .from(BUCKET)
    .download(row.storage_path);

  if (dlErr || !blob) {
    return NextResponse.json({ error: dlErr?.message ?? "download failed" }, { status: 500 });
  }

  const buf = Buffer.from(await blob.arrayBuffer());
  const safeName = row.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return new NextResponse(buf, {
    headers: {
      "Content-Type": row.mime_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}

// DELETE — remove a file
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; file_id: string }> }
) {
  if (!(await isAuthed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, file_id } = await params;

  const sb = createServiceClient();
  const { data: row } = await sb
    .from("contact_files")
    .select("storage_path, filename")
    .eq("id", file_id)
    .eq("contact_id", id)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "File not found" }, { status: 404 });

  await sb.storage.from(BUCKET).remove([row.storage_path]).catch(() => null);
  const { error } = await sb.from("contact_files").delete().eq("id", file_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
