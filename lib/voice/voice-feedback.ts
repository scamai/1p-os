/**
 * Voice Feedback — Text-to-Speech for command confirmations
 * ==========================================================
 * Uses the native Web Speech Synthesis API to speak back
 * confirmations when voice commands are executed.
 */

let enabled = true;

export function setVoiceFeedbackEnabled(on: boolean) {
  enabled = on;
  if (!on) stopSpeaking();
}

export function isVoiceFeedbackEnabled() {
  return enabled;
}

export function speak(text: string, opts?: { rate?: number; pitch?: number }) {
  if (!enabled) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Cancel any in-progress speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = opts?.rate ?? 1.1;
  utterance.pitch = opts?.pitch ?? 1.0;
  utterance.volume = 0.8;
  utterance.lang = "en-US";

  // Pick a natural-sounding voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Samantha") ||
        v.name.includes("Google") ||
        v.name.includes("Natural") ||
        v.name.includes("Enhanced"))
  );
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
