import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Conversation, type PartialOptions } from "@elevenlabs/client";
import { VoicePractice } from "./VoicePractice";

vi.mock("@elevenlabs/client", () => ({ Conversation: { startSession: vi.fn() } }));

const stopTrack = vi.fn();
const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
const getUserMedia = vi.fn();
const endSession = vi.fn();
const fetchSession = vi.fn();
const onFinished = vi.fn();
const conversation = { endSession } as unknown as Conversation;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function show() {
  return render(<VoicePractice tema="skript" temaIme="Скриптът" rejim="izpit" onFinished={onFinished} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  getUserMedia.mockResolvedValue(stream);
  endSession.mockResolvedValue(undefined);
  fetchSession.mockResolvedValue({
    ok: true,
    json: async () => ({ agentId: "agent_test", sesia: "session-1" }),
  });
  vi.stubGlobal("fetch", fetchSession);
  vi.mocked(Conversation.startSession).mockImplementation(async (options: PartialOptions) => {
    options.onConnect?.({ conversationId: "conversation-1" });
    return conversation;
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("VoicePractice", () => {
  it("requests microphone only on tap, passes the session variables and stops the call", async () => {
    show();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(fetchSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Започни/ }));
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    await screen.findByText("Слуша те");
    expect(Conversation.startSession).toHaveBeenCalledWith(expect.objectContaining({
      agentId: "agent_test",
      connectionType: "websocket",
      dynamicVariables: { tema: "skript", tema_ime: "Скриптът", rejim: "izpit", sesia: "session-1" },
    }));
    expect(stopTrack).toHaveBeenCalledOnce();

    const options = vi.mocked(Conversation.startSession).mock.calls[0][0];
    act(() => options.onModeChange?.({ mode: "speaking" }));
    expect(screen.getByText("Говори")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Стоп" }));
    expect(endSession).toHaveBeenCalledOnce();
    expect(onFinished).toHaveBeenCalledOnce();
    expect(screen.getByText("Разговорът приключи")).toBeInTheDocument();
  });

  it("does not create a paid session after microphone permission is denied", async () => {
    getUserMedia.mockRejectedValue(new DOMException("Permission denied", "NotAllowedError"));
    show();
    fireEvent.click(screen.getByRole("button", { name: /Започни/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Разреши достъп до микрофона");
    expect(fetchSession).not.toHaveBeenCalled();
    expect(Conversation.startSession).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Опитай пак/ })).toBeEnabled();
  });

  it("releases late microphone permission when Stop was pressed during the prompt", async () => {
    const permission = deferred<MediaStream>();
    getUserMedia.mockReturnValue(permission.promise);
    show();
    fireEvent.click(screen.getByRole("button", { name: /Започни/ }));
    fireEvent.click(screen.getByRole("button", { name: "Стоп" }));

    await act(async () => { permission.resolve(stream); });
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(fetchSession).not.toHaveBeenCalled();
    expect(Conversation.startSession).not.toHaveBeenCalled();
  });

  it("closes a connection that resolves after the component has unmounted", async () => {
    const pending = deferred<Conversation>();
    vi.mocked(Conversation.startSession).mockReturnValue(pending.promise);
    const view = show();
    fireEvent.click(screen.getByRole("button", { name: /Започни/ }));
    await waitFor(() => expect(Conversation.startSession).toHaveBeenCalledOnce());
    view.unmount();
    expect(stopTrack).toHaveBeenCalledOnce();

    await act(async () => { pending.resolve(conversation); });
    expect(endSession).toHaveBeenCalledOnce();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it("ends the active conversation when Safari leaves the page", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: /Започни/ }));
    await screen.findByText("Слуша те");
    act(() => { window.dispatchEvent(new Event("pagehide")); });
    expect(endSession).toHaveBeenCalledOnce();
    expect(screen.getByText("Разговорът приключи")).toBeInTheDocument();
  });
});
