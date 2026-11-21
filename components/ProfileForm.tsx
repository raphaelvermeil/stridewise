// Part 4: the runner's details (sex, age, height, weight, experience, runs per week, injuries). Used by onboarding and the profile page.
"use client";

import { useState, type FormEvent } from "react";
import { saveProfile, type Profile } from "@/lib/db/profiles";
import { btnPrimary, card, input, label } from "@/components/ui/styles";
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

type Props = {
  initial?: Profile; // prefill when editing
  submitLabel: string;
  onSaved: () => void;
};

export default function ProfileForm({ initial, submitLabel, onSaved }: Props) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
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
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className={`${card} flex flex-col gap-4`}>
      <label className={label}>
        Sex
        <select className={input} name="sex" required defaultValue={initial?.sex ?? ""}>
          <option value="" disabled>Choose…</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>
      </label>
      <label className={label}>
        Age
        <input className={input} name="age" type="number" required min={10} max={100} defaultValue={initial?.age} />
      </label>
      <label className={label}>
        Height (cm)
        <input className={input} name="heightCm" type="number" required min={100} max={250} defaultValue={initial?.heightCm} />
      </label>
      <label className={label}>
        Weight (kg)
        <input className={input} name="weightKg" type="number" required min={30} max={250} step="0.1" defaultValue={initial?.weightKg} />
      </label>
      <label className={label}>
        Running experience
        <select className={input} name="experience" required defaultValue={initial?.experience ?? "beginner"}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="elite">Elite</option>
        </select>
      </label>
      <label className={label}>
        Runs per week
        <input className={input} name="runsPerWeek" type="number" required min={0} max={14} defaultValue={initial?.runsPerWeek} />
      </label>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1.5 font-medium">Past running injuries <span className="text-body-sm font-normal text-muted">(tick all that apply, or leave blank)</span></legend>
        <div className="flex flex-col gap-1 rounded-sm bg-bg/50 p-3">
          {INJURIES.map((i) => (
            <label key={i.key} className="flex items-center gap-2 py-0.5">
              <input type="checkbox" name="injury" value={i.key} className="size-4 accent-ink"
                defaultChecked={initial?.injuryHistory.includes(i.key)} />
              {i.label}
            </label>
          ))}
        </div>
      </fieldset>
      <button className={`${btnPrimary} mt-2`} disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </button>
      {error && <p role="alert" className="text-body-sm text-muted">{error}</p>}
    </form>
  );
}
