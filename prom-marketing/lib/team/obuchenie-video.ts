import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Обучителното видео за екипа („цялата система за 4 минути“) стои в ЧАСТЕН бъкет:
 * гледа се само след вход в /ekip, с подписан линк за няколко часа. Докато файлът
 * го няма в бъкета, разделът във „Материали“ просто не се показва — качването на
 * файла е и пускането му.
 */
export const EKIP_VIDEO_BUCKET = "ekip-video";
export const OBUCHENIE_VIDEO_PATH = "obuchenie-crm.mp4";
const TTL_SECONDS = 4 * 3600;

export async function obuchenieVideoUrl(): Promise<string | null> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.storage.from(EKIP_VIDEO_BUCKET).createSignedUrl(OBUCHENIE_VIDEO_PATH, TTL_SECONDS);
    return error || !data?.signedUrl ? null : data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Подписан линк за друг файл от същия бъкет (видео отзивите). С `download` линкът
 * сваля файла под това име, вместо да го пуска в браузъра. Няма файл → null.
 */
export async function ekipVideoUrl(path: string, download?: string): Promise<string | null> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.storage
      .from(EKIP_VIDEO_BUCKET)
      .createSignedUrl(path, TTL_SECONDS, download ? { download } : undefined);
    return error || !data?.signedUrl ? null : data.signedUrl;
  } catch {
    return null;
  }
}
