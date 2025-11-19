import { useEffect, useState, useCallback, useRef } from "react";

// More human-sounding filler words (phonetically tuned)
function humanizeSpeechText(text: string): string {
  const fillers = [" ", " ", " ", " ", " "];
  const words = text.split(" ");
  const result: string[] = [];

  for (let i = 0; i < words.length; i++) {
    result.push(words[i]);

    // Inject filler words randomly (~15% chance mid-sentence)
    if (
      Math.random() < 0.1 &&
      i > 3 &&
      !/[?.!]/.test(words[i]) &&
      words[i].length > 3
    ) {
      const filler = fillers[Math.floor(Math.random() * fillers.length)];
      result.push(filler);
    }
  }

  // Add thinking pause before questions
  return result.join(" ").replace(/\?/g, ", hmmm?");
}

interface TTSOptions {
  enableBackgroundNoise?: boolean;
  rate?: number;
  pitch?: number;
  volume?: number;
  backgroundVolume?: number;
}

export function useInterviewerTTS(options: TTSOptions = {}) {
  const {
    enableBackgroundNoise = true,
    rate = 1.3,
    pitch = 1.6,
    volume = 0.4,
    backgroundVolume = 0.25,
  } = options;

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  const ambienceOptions = [
    "/audio/office.mp3",
    "/audio/people.mp3",
    "/audio/cafe.mp3",
  ];

  // Load voices
  useEffect(() => {
    if (!synth) return;
    const loadVoices = () => setVoices(synth.getVoices());
    synth.addEventListener("voiceschanged", loadVoices);
    loadVoices();
    return () => synth.removeEventListener("voiceschanged", loadVoices);
  }, [synth]);

  // Manage background sound
  useEffect(() => {
    if (!enableBackgroundNoise) {
      bgAudioRef.current?.pause();
      return;
    }

    // Randomly pick a background sound
    const randomAmbience =
      ambienceOptions[Math.floor(Math.random() * ambienceOptions.length)];

    if (!bgAudioRef.current) {
      bgAudioRef.current = new Audio(randomAmbience);
      bgAudioRef.current.loop = true;
    } else {
      bgAudioRef.current.src = randomAmbience;
    }

    bgAudioRef.current.volume = backgroundVolume;
    bgAudioRef.current.play().catch(() => {});

    return () => {
      bgAudioRef.current?.pause();
    };
  }, [enableBackgroundNoise, backgroundVolume]);

  const getBestVoice = useCallback(() => {
    if (!voices.length) return null;
    return (
      voices.find((v) => v.name.includes("Google US English")) ||
      voices.find((v) => v.name.includes("Google UK English")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0]
    );
  }, [voices]);

  const readQuestion = useCallback(
    async (text: string) => {
      if (!synth) return;
      synth.cancel();

      const enrichedText = humanizeSpeechText(text);
      const sentences = enrichedText
        .replace(/\s+/g, " ")
        .split(/([.?!])/)
        .reduce((acc, cur) => {
          if (/[.?!]/.test(cur) && acc.length) acc[acc.length - 1] += cur;
          else if (cur.trim()) acc.push(cur.trim());
          return acc;
        }, [] as string[]);

      setIsSpeaking(true);

      // Adjust background volume when speaking
      if (bgAudioRef.current && enableBackgroundNoise) {
        bgAudioRef.current.volume = backgroundVolume;
      }

      for (const sentence of sentences) {
        const utter = new SpeechSynthesisUtterance(sentence);
        utter.voice = getBestVoice() || null;
        utter.rate = rate;
        utter.pitch = pitch;
        utter.volume = volume;

        await new Promise<void>((resolve) => {
          utter.onend = resolve;
          utter.onerror = resolve;
          synth.speak(utter);
        });

        const pause = 300 + Math.random() * 400;
        await new Promise((r) => setTimeout(r, pause));
      }

      setIsSpeaking(false);

      // Lower background volume when done speaking
      if (bgAudioRef.current && enableBackgroundNoise) {
        bgAudioRef.current.volume = backgroundVolume * 0.6;
      }
    },
    [
      getBestVoice,
      synth,
      rate,
      pitch,
      volume,
      enableBackgroundNoise,
      backgroundVolume,
    ]
  );

  const stopSpeaking = useCallback(() => {
    if (!synth) return;
    synth.cancel();
    setIsSpeaking(false);
    if (bgAudioRef.current && enableBackgroundNoise) {
      bgAudioRef.current.volume = backgroundVolume * 0.6;
    }
  }, [synth, enableBackgroundNoise, backgroundVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (synth) synth.cancel();
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current = null;
      }
    };
  }, [synth]);

  return { readQuestion, stopSpeaking, isSpeaking };
}
