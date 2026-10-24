"use client";

// Звукът: микрофонът (Ивайло) и звукът от таба на срещата (клиентът) → 16 kHz PCM
// → ElevenLabs Scribe v2 Realtime през WebSocket. На Мака не се смята нищо —
// браузърът само праща звука и показва текста.

const WORKLET = `
// Преобразува всяка честота (обикновено 48 kHz) в 16 kHz моно Int16 на парчета от 100 ms.
// При цяло съотношение (48k → 3) осреднява групите — прост нискочестотен филтър срещу алиасинг.
class PcmTap extends AudioWorkletProcessor {
  constructor() {
    super();
    this.step = sampleRate / 16000;
    this.k = Math.round(this.step);
    this.cyalo = Math.abs(this.step - this.k) < 1e-6;
    this.acc = 0; this.br = 0;
    this.t = 0; this.last = 0;
    this.buf = new Int16Array(1600); this.n = 0; this.peak = 0;
  }
  izhod(v) {
    if (v > 1) v = 1; else if (v < -1) v = -1;
    const a = v < 0 ? -v : v;
    if (a > this.peak) this.peak = a;
    this.buf[this.n++] = v < 0 ? v * 0x8000 : v * 0x7fff;
    if (this.n === this.buf.length) {
      this.port.postMessage({ pcm: this.buf.buffer, peak: this.peak }, [this.buf.buffer]);
      this.buf = new Int16Array(1600); this.n = 0; this.peak = 0;
    }
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    if (this.cyalo) {
      for (let i = 0; i < ch.length; i++) {
        this.acc += ch[i];
        if (++this.br === this.k) { this.izhod(this.acc / this.k); this.acc = 0; this.br = 0; }
      }
      return true;
    }
    let t = this.t;
    while (t < ch.length - 1) {
      const i = Math.floor(t), f = t - i;
      const x0 = i < 0 ? this.last : ch[i];
      this.izhod(x0 + (ch[i + 1] - x0) * f);
      t += this.step;
    }
    this.t = t - ch.length;
    this.last = ch[ch.length - 1];
    return true;
  }
}
registerProcessor("pcm-tap", PcmTap);
`;

const zaredeni = new WeakSet<AudioContext>();

export interface Tap {
  spri(): void;
  nivo(): number;
  /** Колко ms потокът дава пълна тишина (нули). Жив микрофон никога не дава точни нули — дори в тиха стая. */
  tihoMs(): number;
}

/** Закача поток към контекста и връща 100 ms парчета Int16 PCM. */
export async function zakachi(ctx: AudioContext, potok: MediaStream, naParche: (pcm: ArrayBuffer) => void): Promise<Tap> {
  if (!zaredeni.has(ctx)) {
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    await ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    zaredeni.add(ctx);
  }
  const src = ctx.createMediaStreamSource(potok);
  const node = new AudioWorkletNode(ctx, "pcm-tap", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 1,
    channelCountMode: "explicit",
    channelInterpretation: "speakers",
  });
  let nivo = 0;
  let zhivoOt = -Infinity; // докато не дойде истински звук, потокът се брои за тих
  node.port.onmessage = (e: MessageEvent<{ pcm: ArrayBuffer; peak: number }>) => {
    nivo = e.data.peak;
    if (nivo > 2e-5) zhivoOt = performance.now();
    naParche(e.data.pcm);
  };
  const tiho = ctx.createGain();
  tiho.gain.value = 0;
  src.connect(node);
  node.connect(tiho);
  tiho.connect(ctx.destination);
  return {
    spri() {
      node.port.onmessage = null;
      src.disconnect();
      node.disconnect();
      tiho.disconnect();
    },
    nivo: () => nivo,
    tihoMs: () => performance.now() - zhivoOt,
  };
}

export async function vzemiMikrofon(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  });
}

/** Звукът от таба на Meet/Zoom. Chrome показва избор — трябва „Сподели и звука на таба“. */
export async function vzemiTab(): Promise<MediaStream> {
  const opcii = {
    video: true,
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    preferCurrentTab: false,
    selfBrowserSurface: "exclude",
    systemAudio: "include",
    surfaceSwitching: "include",
  } as DisplayMediaStreamOptions;
  const s = await navigator.mediaDevices.getDisplayMedia(opcii);
  if (!s.getAudioTracks().length) {
    s.getTracks().forEach((t) => t.stop());
    throw new Error("Няма звук от таба. Избери таба със срещата и отметни „Сподели и звука на таба“.");
  }
  s.getVideoTracks().forEach((t) => t.stop());
  return new MediaStream(s.getAudioTracks());
}

function b64(buf: ArrayBuffer) {
  const u8 = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
}

export type ScribeStatus = "izkl" | "svarzva" | "slusha" | "prekasnato" | "greshka";

interface Slushateli {
  chernova(t: string): void;
  gotovo(t: string): void;
  status(s: ScribeStatus, sabshtenie?: string): void;
}

/** Една линия към Scribe v2 Realtime — сама се свързва наново при прекъсване. */
export class ScribeLiniya {
  private ws: WebSocket | null = null;
  private zatvorena = false;
  private opashka: string[] = [];
  private opiti = 0;
  private bezEzik = false;

  constructor(private vzemiToken: () => Promise<string>, private h: Slushateli) {}

  get otvorena() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async otvori(): Promise<void> {
    if (this.zatvorena) return;
    this.h.status("svarzva");
    let token: string;
    try {
      token = await this.vzemiToken();
    } catch (e) {
      this.h.status("greshka", e instanceof Error ? e.message : "Няма токен.");
      return this.otnovo();
    }
    const p = new URLSearchParams({
      model_id: "scribe_v2_realtime",
      token,
      audio_format: "pcm_16000",
      commit_strategy: "vad",
      vad_silence_threshold_secs: "1.0",
    });
    if (!this.bezEzik) p.set("language_code", "bg");
    const ws = new WebSocket(`wss://api.elevenlabs.io/v1/speech-to-text/realtime?${p.toString()}`);
    this.ws = ws;
    ws.onopen = () => {
      this.opiti = 0;
      this.h.status("slusha");
      for (const m of this.opashka.splice(0)) ws.send(m);
    };
    ws.onmessage = (e: MessageEvent<string>) => {
      let m: { message_type?: string; text?: string; error?: string };
      try {
        m = JSON.parse(e.data);
      } catch {
        return;
      }
      if (m.message_type === "partial_transcript") this.h.chernova(m.text ?? "");
      else if (m.message_type === "committed_transcript" || m.message_type === "committed_transcript_with_timestamps") {
        const t = (m.text ?? "").trim();
        this.h.chernova("");
        if (t) this.h.gotovo(t);
      } else if (m.error) {
        if (/language/i.test(m.error)) this.bezEzik = true;
        this.h.status("greshka", `${m.message_type}: ${m.error}`);
      }
    };
    ws.onclose = () => {
      if (this.ws === ws) this.ws = null;
      if (!this.zatvorena) {
        this.h.status("prekasnato");
        this.otnovo();
      }
    };
  }

  private otnovo() {
    if (this.zatvorena) return;
    const sek = Math.min(10, 1 + this.opiti++ * 2);
    setTimeout(() => void this.otvori(), sek * 1000);
  }

  prati(pcm: ArrayBuffer) {
    const msg = JSON.stringify({ message_type: "input_audio_chunk", audio_base_64: b64(pcm), commit: false, sample_rate: 16000 });
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(msg);
    else {
      this.opashka.push(msg);
      if (this.opashka.length > 30) this.opashka.shift();
    }
  }

  zatvori() {
    this.zatvorena = true;
    try {
      this.ws?.close(1000);
    } catch {
      // вече е затворена
    }
    this.h.status("izkl");
  }
}

/**
 * Микрофонът чува тонколоните: реплика „на Ивайло“, която почти дума по дума повтаря
 * току-що казаното от клиента, е ехо. Огледалният въпрос на Ивайло („Изпускаш клиенти —
 * какво имаш предвид?“) не е ехо: въпрос срещу твърдение се пропуска.
 */
export function eEho(moe: string, klientski: string[]): boolean {
  const dumi = (x: string) => new Set(x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").split(" ").filter((w) => w.length > 2));
  const a = dumi(moe);
  if (a.size < 3) return false;
  const vapros = moe.trim().endsWith("?");
  for (const k of klientski) {
    if (vapros && !k.trim().endsWith("?")) continue;
    const b = dumi(k);
    let obshto = 0;
    for (const w of a) if (b.has(w)) obshto++;
    if (obshto / a.size >= 0.7 && a.size >= b.size * 0.4) return true;
  }
  return false;
}
