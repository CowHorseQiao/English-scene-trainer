"use client";

export type SegmentQueueItem = { text: string; voiceType?: string };

export interface TTSProvider {
  readonly name: string;
  speak(text: string, rate: number, voiceType?: string): Promise<void>;
  speakQueue(items: SegmentQueueItem[], rate: number): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  setRate(rate: number): void;
  onChange: ((state: { speaking: boolean; paused: boolean }) => void) | null;
}

export class BrowserTTSProvider implements TTSProvider {
  name = "浏览器";
  onChange: ((state: { speaking: boolean; paused: boolean }) => void) | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private currentRate = 1;
  supported = false;

  constructor() {
    this.supported = typeof window !== "undefined" && "speechSynthesis" in window;
  }

  async speak(text: string, rate: number, _voiceType?: string): Promise<void> {
    if (!this.supported) return;

    window.speechSynthesis.cancel();
    this.currentRate = rate;

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = rate;

      utterance.onstart = () => this.onChange?.({ speaking: true, paused: false });
      utterance.onend = () => {
        this.onChange?.({ speaking: false, paused: false });
        this.utterance = null;
        resolve();
      };
      utterance.onerror = (event) => {
        if (event.error !== "canceled" && event.error !== "interrupted") {
          console.error("Browser TTS error", event.error);
        }
        this.onChange?.({ speaking: false, paused: false });
        this.utterance = null;
        resolve();
      };

      this.utterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }

  async speakQueue(items: SegmentQueueItem[], rate: number): Promise<void> {
    const combined = items.map((i) => i.text).filter(Boolean).join("\n\n");
    await this.speak(combined, rate);
  }

  pause(): void {
    window.speechSynthesis.pause();
  }

  resume(): void {
    window.speechSynthesis.resume();
  }

  stop(): void {
    window.speechSynthesis.cancel();
    this.utterance = null;
    this.onChange?.({ speaking: false, paused: false });
  }

  setRate(rate: number): void {
    this.currentRate = rate;
    if (this.utterance) {
      const text = this.utterance.text;
      this.stop();
      setTimeout(() => this.speak(text, rate), 50);
    }
  }
}

export class VolcengineTTSProvider implements TTSProvider {
  name = "火山引擎";
  onChange: ((state: { speaking: boolean; paused: boolean }) => void) | null = null;
  private audio: HTMLAudioElement | null = null;
  private currentRate = 1;
  private active = false;
  private materialId?: string;

  setMaterialId(id: string) {
    this.materialId = id;
  }

  private async fetchAudioUrl(text: string, rate: number, voiceType?: string): Promise<string> {
    const body: Record<string, unknown> = { text, speed: rate };
    if (voiceType) body.voiceType = voiceType;
    if (this.materialId) body.materialId = this.materialId;

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Volcengine TTS failed");
    }

    const binary = atob(result.audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: "audio/mpeg" });
    return URL.createObjectURL(blob);
  }

  private playAudioUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      this.audio = audio;

      audio.onplay = () => this.onChange?.({ speaking: true, paused: false });
      audio.onended = () => {
        this.onChange?.({ speaking: false, paused: false });
        URL.revokeObjectURL(url);
        this.audio = null;
        resolve();
      };
      audio.onerror = () => {
        this.onChange?.({ speaking: false, paused: false });
        URL.revokeObjectURL(url);
        this.audio = null;
        reject(new Error("Audio playback failed"));
      };

      audio.play().catch(reject);
    });
  }

  async speak(text: string, rate: number, voiceType?: string): Promise<void> {
    this.stop();
    this.currentRate = rate;
    this.active = true;

    const url = await this.fetchAudioUrl(text, rate, voiceType);
    if (!this.active) {
      URL.revokeObjectURL(url);
      return;
    }

    return this.playAudioUrl(url);
  }

  async speakQueue(items: SegmentQueueItem[], rate: number): Promise<void> {
    this.stop();
    this.active = true;
    this.currentRate = rate;

    // Preload first segment
    let nextUrlPromise: Promise<string> | null = null;
    let nextUrl: string | null = null;

    for (let i = 0; i < items.length; i++) {
      if (!this.active) break;
      const item = items[i];
      if (!item.text.trim()) continue;

      // Use preloaded URL or fetch now
      try {
        const url = nextUrl ?? await this.fetchAudioUrl(item.text, rate, item.voiceType);
        nextUrl = null;
        if (!this.active) { URL.revokeObjectURL(url); break; }

        // Preload next segment while current plays
        if (i + 1 < items.length) {
          const nextItem = items[i + 1];
          if (nextItem.text.trim()) {
            nextUrlPromise = this.fetchAudioUrl(nextItem.text, rate, nextItem.voiceType);
            nextUrlPromise.then((u) => { nextUrl = u; }).catch(() => { nextUrl = null; });
          }
        }

        await this.playAudioUrl(url);
      } catch {
        if (nextUrl) URL.revokeObjectURL(nextUrl);
        break;
      }
    }

    // Cleanup any unused preloaded URL
    if (nextUrl) URL.revokeObjectURL(nextUrl);
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause();
      this.onChange?.({ speaking: true, paused: true });
    }
  }

  resume(): void {
    if (this.audio) {
      this.audio.play().catch(() => {});
      this.onChange?.({ speaking: true, paused: false });
    }
  }

  stop(): void {
    this.active = false;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.onChange?.({ speaking: false, paused: false });
  }

  setRate(rate: number): void {
    this.currentRate = rate;
  }
}
