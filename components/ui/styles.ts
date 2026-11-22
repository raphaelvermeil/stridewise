// Shared class strings, so <button>, <Link> and <input> all look the same without wrapper components.
const pressable = "inline-flex items-center justify-center rounded-full px-5 py-2.5 font-medium transition duration-200 ease-out active:scale-[0.97] disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus";

export const btnPrimary = `${pressable} bg-ink text-white hover:bg-ink/90`;
export const btnSecondary = `${pressable} bg-surface text-ink shadow-xs hover:shadow-sm`;

export const card = "rounded-lg bg-surface p-6 shadow-sm";

export const input = "rounded-sm border border-ink/20 bg-surface px-3 py-2.5 outline-none transition duration-200 ease-out hover:border-ink/40 focus:border-ink focus:shadow-focus";
// Add next to `input` when the value is wrong: soft red outline and glow. "!" so it wins over the normal grey/ink outline.
export const inputInvalid = "border-red-500! focus:shadow-[0_0_0_4px_rgb(239_68_68/0.2)]!";

// Loading spinner in the current text colour (white in a dark button, ink on the page): a faint ring with a solid arc.
export const spinner = "inline-block animate-spin rounded-full border-2 border-current/25 border-t-current";

export const label = "flex flex-col gap-1.5 font-medium";
