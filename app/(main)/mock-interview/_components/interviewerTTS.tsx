"use client";
import { useEffect, useState, useCallback, useRef } from "react";

// More human-sounding filler words (phonetically tuned)
function humanizeSpeechText(text: string): string {
  const fillers = ["hmmm...", "uhh", "aah...", "weelll", "y'know"];
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

// Custom React hook for speech synthesis
function useHumanTTS() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  useEffect(() => {
    if (!synth) return;
    const loadVoices = () => setVoices(synth.getVoices());
    synth.addEventListener("voiceschanged", loadVoices);
    loadVoices();
    return () => synth.removeEventListener("voiceschanged", loadVoices);
  }, [synth]);

  const getBestVoice = useCallback(() => {
    if (!voices.length) return null;
    return (
      voices.find((v) => v.name.includes("Google US English")) ||
      voices.find((v) => v.name.includes("Google UK English")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0]
    );
  }, [voices]);

  const speak = useCallback(
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

      for (const sentence of sentences) {
        const utter = new SpeechSynthesisUtterance(sentence);
        utter.voice = getBestVoice() || null;
        utter.rate = 0.9;
        utter.pitch = 1.05;
        utter.volume = 0.4;

        await new Promise<void>((resolve) => {
          utter.onend = resolve;
          utter.onerror = resolve;
          synth.speak(utter);
        });

        const pause = 300 + Math.random() * 400;
        await new Promise((r) => setTimeout(r, pause));
      }

      setIsSpeaking(false);
    },
    [getBestVoice, synth]
  );

  const stop = useCallback(() => {
    if (!synth) return;
    synth.cancel();
    setIsSpeaking(false);
  }, [synth]);

  return { speak, stop, isSpeaking };
}

export default function InterviewerTTS() {
  const { speak, stop, isSpeaking } = useHumanTTS();
  const [text, setText] = useState(
    "Hi, I’m your interviewer. Could you tell me about a time you overcame a major challenge at work?"
  );
  const [bgEnabled, setBgEnabled] = useState(true);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  const ambienceOptions = [
    "/audio/office.mp3",
    "/audio/people.mp3",
    "/audio/cafe.mp3",
  ];

  // Manage background sound
  useEffect(() => {
    if (!bgEnabled) {
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

    bgAudioRef.current.volume = 0.25;
    bgAudioRef.current.play().catch(() => {});
  }, [bgEnabled, isSpeaking]);

  const handleSpeak = () => {
    if (bgEnabled && bgAudioRef.current) bgAudioRef.current.volume = 0.25;
    speak(text);
  };

  const handleStop = () => {
    stop();
    if (bgAudioRef.current) bgAudioRef.current.volume = 0.15;
  };

  return (
    <div className="max-w-xl mx-auto mt-12 p-6 border rounded-2xl shadow-sm space-y-4 bg-white">
      <h2 className="text-xl font-semibold">🎙️ Realistic Interviewer Voice</h2>

      <textarea
        className="w-full border rounded-lg p-3 text-sm"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex gap-3 items-center">
        <button
          onClick={handleSpeak}
          disabled={isSpeaking}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
        >
          {isSpeaking ? "Speaking..." : "Speak as Interviewer"}
        </button>
        <button
          onClick={handleStop}
          className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
        >
          Stop
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={bgEnabled}
            onChange={() => setBgEnabled(!bgEnabled)}
          />
          Background noise
        </label>
      </div>

      <p className="text-sm text-gray-500">
        Each play randomly picks between office, people, or café background.
        Filler words are phonetically tuned for more natural pronunciation.
      </p>
    </div>
  );
}
