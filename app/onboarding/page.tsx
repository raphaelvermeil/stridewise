// Part 4: height, experience, running frequency, injury history
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/lib/db/profiles";

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await saveProfile({
        heightCm: Number(f.get("heightCm")),
        experience: String(f.get("experience")),
        runsPerWeek: Number(f.get("runsPerWeek")),
        injuryHistory: String(f.get("injuryHistory")),
      });
      router.push("/scan");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">About you</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          Height (cm)
          <input className="rounded border p-2" name="heightCm" type="number" required min={100} max={250} />
        </label>
        <label className="flex flex-col gap-1">
          Running experience
          <select className="rounded border p-2" name="experience" required defaultValue="beginner">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Runs per week
          <input className="rounded border p-2" name="runsPerWeek" type="number" required min={0} max={14} />
        </label>
        <label className="flex flex-col gap-1">
          Injury history
          <textarea className="rounded border p-2" name="injuryHistory" rows={3} placeholder="e.g. shin splints in 2025, or none" />
        </label>
        <button className="rounded bg-black p-2 text-white disabled:opacity-50" disabled={busy}>
          Continue
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}
