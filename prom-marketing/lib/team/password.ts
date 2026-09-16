import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Пароли за екипа: scrypt с 16-байтова случайна сол, записани като
 * `scrypt$<сол hex>$<хеш hex>`. Никаква външна библиотека — node:crypto
 * стига, а Vercel го има.
 */

const KEYLEN = 64;

export function hashPassword(password: string): string {
  if (!password) throw new Error("празна парола");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored || !password) return false;
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  let computed: Buffer;
  try {
    computed = scryptSync(password, salt, KEYLEN);
  } catch {
    return false;
  }
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== computed.length) return false;
  try {
    return timingSafeEqual(computed, expected);
  } catch {
    return false;
  }
}

/** Без 0/O/1/l/I — паролата се диктува по телефона и се преписва от Viber. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassword(length = 12): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
