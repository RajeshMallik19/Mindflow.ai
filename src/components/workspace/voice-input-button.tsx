"use client";

import { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type SpeechRecognitionResultLike = { transcript: string };
type SpeechRecognitionEventLike = { results: SpeechRecognitionResultLike[][] };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Feature-detects the browser's built-in speech-to-text (Chrome/Edge; not
// Firefox/Safari) — free, no dependency, no API key. Checked at click time
// rather than render time: checking at render time makes the button
// present/absent differently between server and client render passes,
// which is a real hydration mismatch (verified this live — not a
// theoretical concern). Checking on click sidesteps that entirely.
export function VoiceInputButton({ onResult }: { onResult: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setUnsupported(true);
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <Button
      type="button"
      size="icon-sm"
      variant={listening ? "default" : "outline"}
      onClick={toggle}
      title={unsupported ? "Voice input isn't supported in this browser" : undefined}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
    >
      {listening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
    </Button>
  );
}
