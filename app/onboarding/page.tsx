// Part 4: height, weight, experience, running frequency, injury history
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/lib/db/profiles";

const INJURIES = [
  "Runner's knee (patellofemoral pain syndrome)",
  "IT band syndrome",
  "Shin splints (medial tibial stress syndrome)",
  "Achilles tendinopathy",
  "Plantar fasciitis",
  "Stress fracture",
  "Hamstring strain",
  "Patellar tendinopathy (jumper's knee)",
  "Ankle sprain",
  "Calf strain",
  "Hip flexor strain",
  "Piriformis syndrome",
  "Groin strain",
  "Lower back pain",
  "Morton's neuroma",
  "Metatarsalgia (ball-of-foot pain)",
  "Hip bursitis (greater trochanteric pain)",
  "Meniscus tear",
  "Posterior tibial tendinopathy",
  "Peroneal tendinopathy",
];
export default function OnboardingPage() {
  const router = useRouter();
  const [hasOther, setHasOther] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await saveProfile({
        heightCm: Number(f.get("heightCm")),
        weightKg: Number(f.get("weightKg")),
        experience: String(f.get("experience")),
        runsPerWeek: Number(f.get("runsPerWeek")),
        injuryHistory: [...f.getAll("injury").map(String), ...(hasOther ? [String(f.get("injuryOther")).trim()] : [])],
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
          Weight (kg)
          <input className="rounded border p-2" name="weightKg" type="number" required min={30} max={250} step="0.1" />
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
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1">Past running injuries <span className="text-sm text-gray-600">(tick all that apply, or leave blank)</span></legend>
          <div className="max-h-64 overflow-y-auto rounded border p-2">
            {INJURIES.map((i) => (
              <label key={i} className="flex items-center gap-2 py-0.5">
                <input type="checkbox" name="injury" value={i} />
                {i}
              </label>
            ))}
            <label className="flex items-center gap-2 py-0.5">
              <input type="checkbox" checked={hasOther} onChange={(e) => setHasOther(e.target.checked)} />
              Other
            </label>
          </div>
        </fieldset>
        {hasOther && (
          <label className="flex flex-col gap-1">
            Describe your injury
            <input className="rounded border p-2" name="injuryOther" required maxLength={200} autoFocus
              placeholder="e.g. torn ACL in 2024" />
          </label>
        )}
        <button className="rounded bg-black p-2 text-white disabled:opacity-50" disabled={busy}>
          Continue
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}
