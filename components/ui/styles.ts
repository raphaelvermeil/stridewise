// Shared class strings, so <button>, <Link> and <input> all look the same without wrapper components.
const pressable = "inline-flex items-center justify-center rounded-full px-5 py-2.5 font-medium transition duration-200 ease-out active:scale-[0.97] disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus";

export const btnPrimary = `${pressable} bg-ink text-white hover:bg-ink/90`;
export const btnSecondary = `${pressable} bg-surface text-ink shadow-xs hover:shadow-sm`;

export const card = "rounded-lg bg-surface p-6 shadow-sm";

export const input = "rounded-sm bg-surface px-3 py-2.5 shadow-xs outline-none transition duration-200 ease-out focus:shadow-focus";
export const label = "flex flex-col gap-1.5 font-medium";
