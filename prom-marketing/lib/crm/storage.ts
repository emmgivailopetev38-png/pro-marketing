import { createServiceClient } from "@/lib/supabase/service";

/**
 * Хранилището за документите, които Hermes качва през /api/crm/document.
 *
 * Бъкетът е частен. Нищо не се раздава с публичен URL — сваля се само през
 * подписан линк с кратък живот, който се издава на извикващия при поискване.
 */
export const CRM_DOCS_BUCKET = "crm-documents";
export const MAX_DOC_BYTES = 50 * 1024 * 1024; // 50 MB — колкото е лимитът на бъкета
export const SIGNED_URL_TTL = 60 * 10; // 10 минути

/**
 * Път по файловата система, а не ключ в бъкета. Такива пътища са останали от
 * времето, когато Hermes пишеше в диска на VPS-а — файловете зад тях не са
 * достъпни от CRM-а и не се архивират никъде.
 */
export function isLocalPath(path: string | null | undefined): boolean {
  if (!path) return false;
  return path.startsWith("/") || path.startsWith("~") || /^[A-Za-z]:[\\/]/.test(path);
}

/** `<контакт|nesvarzani>/<timestamp>_<безопасно-име>` */
export function buildDocumentKey(scopeId: string | null, fileName: string | null): string {
  const base = (fileName ?? "dokument").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "dokument";
  return `${scopeId ?? "nesvarzani"}/${Date.now()}_${base}`;
}

/** Приема base64 (със или без `data:` префикс) и връща байтовете. */
export function decodeBase64(input: string): { buf: Buffer; mime: string | null } {
  const m = /^data:([^;,]+);base64,([\s\S]*)$/.exec(input.trim());
  if (m) return { buf: Buffer.from(m[2], "base64"), mime: m[1] };
  return { buf: Buffer.from(input.replace(/\s/g, ""), "base64"), mime: null };
}

export async function uploadDocumentBlob(args: {
  key: string;
  buf: Buffer;
  mimeType?: string | null;
}): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb.storage.from(CRM_DOCS_BUCKET).upload(args.key, args.buf, {
    contentType: args.mimeType || "application/octet-stream",
    upsert: false,
  });
  return { error: error?.message ?? null };
}

export async function removeDocumentBlob(key: string): Promise<void> {
  const sb = createServiceClient();
  await sb.storage.from(CRM_DOCS_BUCKET).remove([key]).catch(() => null);
}

/**
 * Подписан линк за сваляне. Връща `null` заедно с причина, когато пътят е
 * локален (стар запис) или файлът липсва в бъкета — извикващият да покаже
 * причината, вместо да предлага линк, който не работи.
 */
export async function signedDocumentUrl(
  storagePath: string | null | undefined
): Promise<{ url: string | null; reason: string | null }> {
  if (!storagePath) return { url: null, reason: "документът няма записан път" };
  if (isLocalPath(storagePath)) {
    return {
      url: null,
      reason: "файлът стои на диска на сървъра, а не в хранилището — качи го наново с file_base64",
    };
  }
  const sb = createServiceClient();
  const { data, error } = await sb.storage
    .from(CRM_DOCS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) {
    return { url: null, reason: error?.message ?? "файлът липсва в хранилището" };
  }
  return { url: data.signedUrl, reason: null };
}
