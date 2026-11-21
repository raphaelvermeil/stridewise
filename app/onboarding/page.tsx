// Part 4: sex, age, height, weight, experience, running frequency, injury history
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/lib/db/profiles";
import type { Fitness, Injury, Sex } from "@/lib/Goal_value/computeGoals";

// Keys match computeGoals' Injury type, which adjusts goals for each one.
const INJURIES: { key: Injury; label: string }[] = [
  { key: "knee", label: "Knee pain (runner's knee, IT band, patellar tendon)" },
  { key: "shin", label: "Shin splints" },
  { key: "stressFracture", label: "Stress fracture" },
  { key: "achilles", label: "Achilles tendinopathy" },
  { key: "plantarFascia", label: "Plantar fasciitis" },
  { key: "hamstring", label: "Hamstring strain" },
  { key: "hip", label: "Hip pain" },
  { key: "lowBack", label: "Lower back pain" },
];

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
        sex: f.get("sex") as Sex,
        age: Number(f.get("age")),
        heightCm: Number(f.get("heightCm")),
        weightKg: Number(f.get("weightKg")),
        experience: f.get("experience") as Fitness,
        runsPerWeek: Number(f.get("runsPerWeek")),
        injuryHistory: f.getAll("injury") as Injury[],
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
          Sex
          <select className="rounded border p-2" name="sex" required defaultValue="">
            <option value="" disabled>Choose…</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Age
          <input className="rounded border p-2" name="age" type="number" required min={10} max={100} />
        </label>
        <label className="flex flex-col gap-1">
          Height (cm)
          <input className="rounded border p-2" name="heightCm" type="number" required min={100} max={250} />
        </label>
        <label className="flex flex-col gap-1">
          Weight (kg)
          <input className="rounded border p-2" name="weightKg" type="number" required min={30} max={250} step="0.1" />
        </label>
        <label className="flex flex-col gap-1">
          Running experience
          <select className="rounded border p-2" name="experience" required defaultValue="beginner">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="elite">Elite</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Runs per week
          <input className="rounded border p-2" name="runsPerWeek" type="number" required min={0} max={14} />
        </label>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1">Past running injuries <span className="text-sm text-gray-600">(tick all that apply, or leave blank)</span></legend>
          <div className="rounded border p-2">
            {INJURIES.map((i) => (
              <label key={i.key} className="flex items-center gap-2 py-0.5">
                <input type="checkbox" name="injury" value={i.key} />
                {i.label}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="rounded bg-black p-2 text-white disabled:opacity-50" disabled={busy}>
          Continue
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}
