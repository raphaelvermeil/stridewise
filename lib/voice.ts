// Part 2: voice prompts with the browser's speechSynthesis.
export function say(text: string): void {
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}
