// Part 2: treadmill speed box with a km/h / mph dropdown. Always reports km/h (or null if invalid) to the page.
"use client";

import { useState } from "react";
import { asKmh, fromKmh, MAX_KMH, MIN_KMH, toKmh, type SpeedUnit } from "@/lib/speed";

const round1 = (n: number) => Math.round(n * 10) / 10;

export default function SpeedInput({ onChange }: { onChange: (kmh: number | null) => void }) {
  const [text, setText] = useState("");
  const [unit, setUnit] = useState<SpeedUnit>("kmh");

  // The 3-25 km/h range, shown in whichever unit is picked (1.9-15.5 mph).
  const min = Math.ceil(fromKmh(MIN_KMH, unit) * 10) / 10;
  const max = Math.floor(fromKmh(MAX_KMH, unit) * 10) / 10;
  const invalid = text !== "" && toKmh(Number(text), unit) === null;

  function update(nextText: string, nextUnit: SpeedUnit) {
    setText(nextText);
    setUnit(nextUnit);
    onChange(toKmh(Number(nextText), nextUnit));
  }

  // Switching units converts the number in the box, so the actual speed stays the same.
  function changeUnit(nextUnit: SpeedUnit) {
    const value = Number(text);
    const converted = text === "" || isNaN(value) ? text : String(round1(fromKmh(asKmh(value, unit), nextUnit)));
    update(converted, nextUnit);
  }

  return (
    <div className="space-y-1">
      <label htmlFor="speed" className="block font-medium">Treadmill speed</label>
      <div className="flex gap-2">
        <input
          id="speed"
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={0.5}
          value={text}
          onChange={(e) => update(e.target.value, unit)}
          aria-invalid={invalid}
          aria-describedby="speed-hint"
          className="w-28 rounded border px-3 py-2"
        />
        <select
          aria-label="Speed unit"
          value={unit}
          onChange={(e) => changeUnit(e.target.value as SpeedUnit)}
          className="rounded border px-3 py-2"
        >
          <option value="kmh">km/h</option>
          <option value="mph">mph</option>
        </select>
      </div>
      <p id="speed-hint" className={invalid ? "text-sm text-red-600" : "text-sm text-gray-600"}>
        {invalid ? `Enter a speed between ${min} and ${max} ${unit === "kmh" ? "km/h" : "mph"}.` : `Between ${min} and ${max} ${unit === "kmh" ? "km/h" : "mph"}. Keep the same speed for every scan.`}
      </p>
    </div>
  );
}
