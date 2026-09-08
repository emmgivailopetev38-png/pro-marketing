/**
 * Вграденият браузър на Facebook, Instagram, Messenger, TikTok и подобни.
 *
 * Там `getUserMedia` за микрофон или не съществува (Android WebView на
 * Facebook и Instagram), или е забранен за страницата (iOS от 15.1). Човекът
 * натиска микрофона и нищо не става — без грешка, без обяснение. Именно
 * оттам идват хората от рекламата, затова за тях по подразбиране предлагаме
 * обаждане, не микрофон.
 *
 * Чиста функция — тества се без браузър.
 */
export function isInAppBrowser(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? "").trim();
  if (!ua) return false;
  return /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|musical_ly|TikTok|Snapchat|Line\/|MicroMessenger|Twitter|BytedanceWebview/i.test(
    ua
  );
}
