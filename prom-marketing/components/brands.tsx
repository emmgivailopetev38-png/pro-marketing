import type { IconType } from "react-icons";
import {
  FaFacebookF, FaInstagram, FaTiktok, FaLinkedinIn, FaYoutube,
  FaWhatsapp, FaTelegram, FaViber, FaGoogle, FaFacebookMessenger, FaMeta,
} from "react-icons/fa6";
import { SiGmail, SiGoogleads } from "react-icons/si";

export type Brand = { name: string; Icon: IconType; color: string };

/* Официални брандови икони + цветове — за визуализация на свързаните канали. */
export const BRANDS = {
  facebook: { name: "Facebook", Icon: FaFacebookF, color: "#1877F2" },
  instagram: { name: "Instagram", Icon: FaInstagram, color: "#E1306C" },
  tiktok: { name: "TikTok", Icon: FaTiktok, color: "#f0f3fa" },
  linkedin: { name: "LinkedIn", Icon: FaLinkedinIn, color: "#0A66C2" },
  youtube: { name: "YouTube", Icon: FaYoutube, color: "#FF0000" },
  messenger: { name: "Messenger", Icon: FaFacebookMessenger, color: "#0084FF" },
  whatsapp: { name: "WhatsApp", Icon: FaWhatsapp, color: "#25D366" },
  viber: { name: "Viber", Icon: FaViber, color: "#7360F2" },
  telegram: { name: "Telegram", Icon: FaTelegram, color: "#26A5E4" },
  gmail: { name: "Gmail", Icon: SiGmail, color: "#EA4335" },
  google: { name: "Google", Icon: FaGoogle, color: "#4285F4" },
  googleads: { name: "Google Ads", Icon: SiGoogleads, color: "#4285F4" },
  meta: { name: "Meta", Icon: FaMeta, color: "#0866FF" },
} satisfies Record<string, Brand>;

export type BrandKey = keyof typeof BRANDS;
