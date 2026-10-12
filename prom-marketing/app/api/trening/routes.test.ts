import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrainingSession } from "@/lib/trening/types";

vi.mock("server-only", () => ({}));
vi.mock("@/data/trening/karti.json", () => ({ default: [
  { id: "primer-skript", tema: "skript", red: 1, zaglavie: "ПРИМЕР", obyasnenie: "", vapros: "Въпрос?", otgovor: "Точен оригинален текст", iztochnik: "" },
  { id: "primer-principi", tema: "principi", red: 1, zaglavie: "ПРИМЕР", obyasnenie: "", vapros: "Въпрос?", otgovor: "Точен оригинален текст", iztochnik: "" },
] }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: () => ({ value: "test" }) })) }));
vi.mock("@/lib/admin/session", () => ({ ADMIN_COOKIE: "admin_session", verifySession: vi.fn(() => true) }));
vi.mock("@/lib/trening/repository", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/trening/repository")>();
  return {
    ...original,
    getTrainingSession: vi.fn(),
    nextTrainingCard: vi.fn(),
    saveTrainingAnswer: vi.fn(),
    createTrainingSession: vi.fn(),
  };
});

import { verifySession } from "@/lib/admin/session";
import { getTrainingSession, nextTrainingCard, saveTrainingAnswer, TrainingError } from "@/lib/trening/repository";
import { POST as nextCard } from "./tools/next-card/route";
import { POST as answer } from "./tools/answer/route";
import { POST as textMode } from "./text/route";
import { GET as voiceSession } from "./session/route";

const id = "c42368c7-2906-4a33-af53-506cb5be74b5";
const session: TrainingSession = {
  id, created_at: "2026-10-12T10:00:00Z", tema: "skript", rejim: "izpit",
  prodalzhitelnost_sek: null, zavarshena: false, transcript: null,
};
const request = (body: unknown, token = "test-voice-token") => new Request("http://localhost/api/trening/tools/test", {
  method: "POST", headers: { "Content-Type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VOICE_AGENT_TOKEN", "test-voice-token");
  vi.stubEnv("VOICE_AGENT_ENABLED", "true");
  vi.stubEnv("HERMES_API_TOKEN", "");
  vi.mocked(verifySession).mockReturnValue(true);
  vi.mocked(getTrainingSession).mockResolvedValue(session);
  vi.mocked(nextTrainingCard).mockResolvedValue({
    card_id: "primer-skript", zaglavie: "ПРИМЕР", vapros: "Въпрос", otgovor: "Оригинал", obyasnenie: "", ostavat: 0,
  });
  vi.mocked(saveTrainingAnswer).mockResolvedValue({ ok: true, tochni: 0, obshto: 1 });
});

describe("достъпът до тренировката", () => {
  it("двата ElevenLabs инструмента отказват без съществуващия гласов токен", async () => {
    expect((await nextCard(request({ sesia: id, tema: "skript" }, ""))).status).toBe(403);
    expect((await answer(request({ sesia: id, card_id: "primer-skript", kazano: "", ocenka: 2, komentar: "" }, "wrong"))).status).toBe(403);
    expect(getTrainingSession).not.toHaveBeenCalled();
  });

  it("текстовият режим и подписаният адрес изискват админ бисквитката", async () => {
    vi.mocked(verifySession).mockReturnValue(false);
    expect((await textMode(request({ action: "next", sesia: id }))).status).toBe(403);
    expect((await voiceSession(new Request("http://localhost/api/trening/session?tema=skript&rejim=izpit"))).status).toBe(403);
    expect(getTrainingSession).not.toHaveBeenCalled();
  });

  it("липсващият trainer agent връща ясно 503", async () => {
    vi.stubEnv("ELEVENLABS_TRAINER_AGENT_ID", "");
    const response = await voiceSession(new Request("http://localhost/api/trening/session?tema=skript&rejim=izpit"));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("ELEVENLABS_TRAINER_AGENT_ID");
  });
});

describe("проверки на сесията и оценката", () => {
  it("връща 404 за непозната сесия", async () => {
    vi.mocked(getTrainingSession).mockRejectedValue(new TrainingError("Сесията не е намерена.", 404));
    expect((await nextCard(request({ sesia: id, tema: "skript" }))).status).toBe(404);
    expect(nextTrainingCard).not.toHaveBeenCalled();
  });

  it("не позволява агентът да смени темата на сесията", async () => {
    expect((await nextCard(request({ sesia: id, tema: "principi" }))).status).toBe(409);
    expect(nextTrainingCard).not.toHaveBeenCalled();
  });

  it("не позволява гласов инструмент върху текстова или приключила сесия", async () => {
    vi.mocked(getTrainingSession).mockResolvedValue({ ...session, rejim: "tekst" });
    expect((await nextCard(request({ sesia: id, tema: "skript" }))).status).toBe(409);
    vi.mocked(getTrainingSession).mockResolvedValue({ ...session, zavarshena: true });
    expect((await nextCard(request({ sesia: id, tema: "skript" }))).status).toBe(409);
  });

  it("отхвърля оценка извън 0, 1 и 2", async () => {
    expect((await answer(request({ sesia: id, card_id: "primer-skript", kazano: "", ocenka: 3, komentar: "" }))).status).toBe(400);
    expect(saveTrainingAnswer).not.toHaveBeenCalled();
  });

  it("смята текстовата оценка на сървъра и игнорира подадена клиентска оценка", async () => {
    vi.mocked(getTrainingSession).mockResolvedValue({ ...session, rejim: "tekst" });
    const response = await textMode(request({ action: "answer", sesia: id, card_id: "primer-skript", kazano: "несъвпадащо", ocenka: 2 }));
    expect(response.status).toBe(200);
    expect((await response.json()).comparison.ocenka).toBe(0);
    expect(saveTrainingAnswer).toHaveBeenCalledWith(expect.objectContaining({ ocenka: 0 }));
  });

  it("не записва карта от чужда тема в текстова сесия", async () => {
    vi.mocked(getTrainingSession).mockResolvedValue({ ...session, rejim: "tekst" });
    expect((await textMode(request({ action: "answer", sesia: id, card_id: "primer-principi", kazano: "текст" }))).status).toBe(409);
    expect(saveTrainingAnswer).not.toHaveBeenCalled();
  });
});
