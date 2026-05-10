"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserTTSProvider, VolcengineTTSProvider, type TTSProvider, type SegmentQueueItem } from "./tts-providers";

export type { TTSProvider, SegmentQueueItem };

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [supported, setSupported] = useState(true);
  const [providerName, setProviderName] = useState<string>("");

  const browserRef = useRef<BrowserTTSProvider | null>(null);
  const volcengineRef = useRef<VolcengineTTSProvider | null>(null);
  const activeRef = useRef<TTSProvider | null>(null);
  const lockedRef = useRef<"volcengine" | "browser" | null>(null);

  // Initialise providers once
  useEffect(() => {
    const browser = new BrowserTTSProvider();
    browserRef.current = browser;

    const onStateChange = (state: { speaking: boolean; paused: boolean }) => {
      setSpeaking(state.speaking);
      setPaused(state.paused);
    };

    browser.onChange = onStateChange;

    if (!browser.supported) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSupported(false);
      setProviderName("不可用");
    }

    return () => {
      browser.stop();
      volcengineRef.current?.stop();
    };
  }, []);

  const cancel = useCallback(() => {
    activeRef.current?.stop();
    activeRef.current = null;
    setSpeaking(false);
    setPaused(false);
  }, []);

  const speakWithProvider = useCallback(
    async (provider: TTSProvider, text: string, r: number, voiceType?: string): Promise<boolean> => {
      try {
        activeRef.current = provider;
        await provider.speak(text, r, voiceType);
        return true;
      } catch (error) {
        console.error(`${provider.name} TTS failed`, error);
        if (activeRef.current === provider) {
          activeRef.current = null;
          setSpeaking(false);
          setPaused(false);
        }
        return false;
      }
    },
    [],
  );

  const speak = useCallback(
    async (text: string, voiceType?: string) => {
      if (!text.trim()) return;

      cancel();

      const ttsProvider = process.env.NEXT_PUBLIC_TTS_PROVIDER;

      if (ttsProvider === "browser") {
        const browser = browserRef.current!;
        if (browser.supported) {
          setProviderName(browser.name);
          lockedRef.current = "browser";
          setSupported(true);
          await speakWithProvider(browser, text, rate);
        }
        return;
      }

      const locked = lockedRef.current;

      if (locked === "volcengine") {
        if (!volcengineRef.current) {
          volcengineRef.current = new VolcengineTTSProvider();
          volcengineRef.current.onChange = browserRef.current!.onChange;
        }
        const ok = await speakWithProvider(volcengineRef.current, text, rate, voiceType);
        if (!ok) {
          lockedRef.current = null;
          const browser = browserRef.current!;
          if (browser.supported) {
            setProviderName(browser.name);
            lockedRef.current = "browser";
            await speakWithProvider(browser, text, rate);
          }
        }
        return;
      }

      if (locked === "browser") {
        const browser = browserRef.current!;
        if (browser.supported) {
          await speakWithProvider(browser, text, rate);
        }
        return;
      }

      // Not locked yet — try Volcengine first
      setProviderName("火山引擎");
      const volcengine = new VolcengineTTSProvider();
      volcengine.onChange = browserRef.current!.onChange;
      volcengineRef.current = volcengine;
      const volcOk = await speakWithProvider(volcengine, text, rate, voiceType);
      if (volcOk) {
        lockedRef.current = "volcengine";
        setSupported(true);
        return;
      }

      // Volcengine failed, fallback to browser
      const browser = browserRef.current!;
      if (browser.supported) {
        setProviderName(browser.name);
        lockedRef.current = "browser";
        setSupported(true);
        await speakWithProvider(browser, text, rate);
      } else {
        setProviderName("不可用");
        setSupported(false);
      }
    },
    [cancel, rate, speakWithProvider],
  );

  const speakQueue = useCallback(
    async (items: SegmentQueueItem[]) => {
      if (items.length === 0) return;

      cancel();

      const provider = activeRef.current;
      if (provider && lockedRef.current) {
        activeRef.current = provider;
        try {
          await provider.speakQueue(items, rate);
        } catch (error) {
          console.error("speakQueue failed", error);
          setSpeaking(false);
          setPaused(false);
        }
        return;
      }

      const ttsProvider = process.env.NEXT_PUBLIC_TTS_PROVIDER;

      if (ttsProvider === "browser") {
        const browser = browserRef.current!;
        if (browser.supported) {
          setProviderName(browser.name);
          lockedRef.current = "browser";
          activeRef.current = browser;
          await browser.speakQueue(items, rate);
        }
        return;
      }

      const volcengine = new VolcengineTTSProvider();
      volcengine.onChange = browserRef.current!.onChange;
      volcengineRef.current = volcengine;
      setProviderName("火山引擎");
      activeRef.current = volcengine;
      try {
        await volcengine.speakQueue(items, rate);
        lockedRef.current = "volcengine";
        setSupported(true);
      } catch {
        activeRef.current = null;
        const browser = browserRef.current!;
        if (browser.supported) {
          setProviderName(browser.name);
          lockedRef.current = "browser";
          activeRef.current = browser;
          await browser.speakQueue(items, rate);
        }
      }
    },
    [cancel, rate],
  );

  const pause = useCallback(() => {
    activeRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    activeRef.current?.resume();
  }, []);

  const setRateAndRestart = useCallback(
    (newRate: number) => {
      setRate(newRate);
      const provider = activeRef.current;
      if (provider && speaking) {
        provider.setRate(newRate);
      }
    },
    [speaking],
  );

  return {
    supported,
    speaking,
    paused,
    rate,
    providerName,
    speak,
    speakQueue,
    pause,
    resume,
    stop: cancel,
    setRate: setRateAndRestart,
  } as const;
}
