import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TextPractice } from "./TextPractice";
import { compareAnswer } from "@/lib/trening/comparison";

const fetchRequest = vi.fn();
const finished = vi.fn();
const card = { card_id: "example", zaglavie: "ПРИМЕР · Карта", vapros: "Повтори текста.", obyasnenie: "", otgovor: "Едно две три", ostavat: 0 };
const response = (body: unknown, ok = true) => ({ ok, json: async () => body });

beforeEach(() => {
  vi.clearAllMocks();
  fetchRequest.mockResolvedValue(response({ ok: true }));
  vi.stubGlobal("fetch", fetchRequest);
});

afterEach(async () => {
  cleanup();
  await Promise.resolve();
  vi.unstubAllGlobals();
});

function show() {
  return render(<TextPractice sesia="test-session" initialCard={card} onFinished={finished} />);
}

describe("TextPractice", () => {
  it("retries with the same attempt ID and requires Пак before another answer", async () => {
    fetchRequest
      .mockRejectedValueOnce(new Error("Връзката прекъсна."))
      .mockResolvedValueOnce(response({ ok: true, tochni: 1, obshto: 1, comparison: compareAnswer(card.otgovor, card.otgovor) }));
    show();
    fireEvent.change(screen.getByLabelText("Твоят отговор"), { target: { value: card.otgovor } });
    fireEvent.click(screen.getByRole("button", { name: "Провери" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Връзката прекъсна");
    fireEvent.click(screen.getByRole("button", { name: "Провери" }));
    expect(await screen.findByText("100%")).toBeInTheDocument();
    const first = JSON.parse(fetchRequest.mock.calls[0][1].body);
    const retry = JSON.parse(fetchRequest.mock.calls[1][1].body);
    expect(first.attempt_id).toBeTruthy();
    expect(retry.attempt_id).toBe(first.attempt_id);
    expect(screen.queryByRole("button", { name: "Провери" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Пак" }));
    fireEvent.change(screen.getByLabelText("Твоят отговор"), { target: { value: card.otgovor } });
    fetchRequest.mockResolvedValueOnce(response({ ok: true, tochni: 2, obshto: 2, comparison: compareAnswer(card.otgovor, card.otgovor) }));
    fireEvent.click(screen.getByRole("button", { name: "Провери" }));
    await screen.findByText("100%");
    expect(JSON.parse(fetchRequest.mock.calls[2][1].body).attempt_id).not.toBe(first.attempt_id);
  });

  it("prevents double taps while a save is in flight", async () => {
    let resolve!: (value: unknown) => void;
    fetchRequest.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    show();
    fireEvent.change(screen.getByLabelText("Твоят отговор"), { target: { value: "едно" } });
    const check = screen.getByRole("button", { name: "Провери" });
    fireEvent.click(check);
    fireEvent.click(check);
    expect(fetchRequest).toHaveBeenCalledOnce();
    await act(async () => resolve(response({ ok: true, tochni: 0, obshto: 1, comparison: compareAnswer(card.otgovor, "едно") })));
    expect(await screen.findByText("33%")).toBeInTheDocument();
  });

  it("does not finish during StrictMode effect replay but finishes on a real unmount", async () => {
    const view = render(<StrictMode><TextPractice sesia="test-session" initialCard={card} onFinished={finished} /></StrictMode>);
    await act(async () => { await Promise.resolve(); });
    expect(fetchRequest).not.toHaveBeenCalled();
    view.unmount();
    await waitFor(() => expect(fetchRequest).toHaveBeenCalledOnce());
    expect(fetchRequest.mock.calls[0][1].keepalive).toBe(true);
    expect(JSON.parse(fetchRequest.mock.calls[0][1].body)).toEqual({ action: "finish", sesia: "test-session" });
  });

  it("finishes explicitly once and does not repeat it on unmount", async () => {
    const view = show();
    fireEvent.click(screen.getByRole("button", { name: "Приключи" }));
    await waitFor(() => expect(finished).toHaveBeenCalledOnce());
    view.unmount();
    await act(async () => { await Promise.resolve(); });
    expect(fetchRequest).toHaveBeenCalledOnce();
  });

  it("waits for a pending answer before closing a session on unmount", async () => {
    let resolve!: (value: unknown) => void;
    fetchRequest.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const view = show();
    fireEvent.change(screen.getByLabelText("Твоят отговор"), { target: { value: "едно" } });
    fireEvent.click(screen.getByRole("button", { name: "Провери" }));
    view.unmount();
    await act(async () => { await Promise.resolve(); });
    expect(fetchRequest).toHaveBeenCalledOnce();
    expect(fetchRequest.mock.calls[0][1].keepalive).toBe(true);
    await act(async () => resolve(response({ ok: true, tochni: 0, obshto: 1, comparison: compareAnswer(card.otgovor, "едно") })));
    await waitFor(() => expect(fetchRequest).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchRequest.mock.calls[1][1].body).action).toBe("finish");
  });
});
