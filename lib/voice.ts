// Part 2: voice prompts with the browser's speechSynthesis.

// Keep a reference to each line until it finishes: Chrome can drop the "finished" event of a line it has garbage-collected.
const speaking = new Set<SpeechSynthesisUtterance>();

/** Speaks the text. The promise resolves when it has finished (or was cancelled/failed), so callers can wait for it. */
export function say(text: string): Promise<void> {
  return new Promise((resolve) => {
    const line = new SpeechSynthesisUtterance(text);
    line.onend = line.onerror = () => {
      speaking.delete(line);
      resolve();
    };
    speaking.add(line);
    speechSynthesis.speak(line);
  });
}
