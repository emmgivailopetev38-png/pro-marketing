import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { KINO } from "./config";

/**
 * Шрифтовете за картинките (билетът, афишът за споделяне). Satori рисува
 * само с подадени шрифтове — без тях кирилицата излиза на квадратчета.
 * Noto Sans вече е в public/fonts (ползват го PDF-ите). Чете се от диска;
 * ако файлът не е стигнал до функцията — от сайта.
 */

type Font = { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" };

let cached: Promise<Font[]> | null = null;

async function load(file: string): Promise<ArrayBuffer> {
  try {
    const buf = await readFile(join(process.cwd(), "public", "fonts", file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    const res = await fetch(`${KINO.site}/fonts/${file}`);
    return res.arrayBuffer();
  }
}

export function kinoFonts(): Promise<Font[]> {
  if (!cached) {
    cached = Promise.all([load("NotoSans-Regular.ttf"), load("NotoSans-Bold.ttf")])
      .then(([regular, bold]) => [
        { name: "Noto Sans", data: regular, weight: 400 as const, style: "normal" as const },
        { name: "Noto Sans", data: bold, weight: 700 as const, style: "normal" as const },
      ])
      .catch((e) => {
        cached = null;
        throw e;
      });
  }
  return cached;
}
