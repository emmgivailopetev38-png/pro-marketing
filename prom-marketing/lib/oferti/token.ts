import { randomBytes } from "node:crypto";

const TOKEN_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Публичният код на офертата: 10 знака без двусмислени букви. */
export function newToken(len = 10): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  return out;
}
