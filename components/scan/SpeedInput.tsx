// Part 2: treadmill speed box with a unit dropdown (km/h, mph, min/km, min/mile). Always reports km/h (or null if invalid) to the page.
"use client";

import { useState } from "react";
import { input, inputInvalid } from "@/components/ui/styles";
import { asKmh, format, fromKmh, isPace, limits, parse, rangeText, toKmh, UNIT_LABELS, type SpeedUnit } from "@/lib/speed";

export default function SpeedInput({ onChange }: { onChange: (kmh: number | null) => void }) {
  const [text, setText] = useState("");
  const [unit, setUnit] = useState<SpeedUnit>("kmh");

  const pace = isPace(unit);
  const invalid = text !== "" && toKmh(text, unit) === null;
  const range = `${rangeText(unit)} ${UNIT_LABELS[unit]}`;
  // The arrows step by 0.5 and stop at the range ends (rounded inward to a 0.5, e.g. mph: 2–15.5). Paces have no arrows.
  const [lo, hi] = limits(unit);

  function update(nextText: string, nextUnit: SpeedUnit) {
    setText(nextText);
    setUnit(nextUnit);
    onChange(toKmh(nextText, nextUnit));
  }

  // Switching units converts the number in the box, so the actual speed stays the same.
  function changeUnit(nextUnit: SpeedUnit) {
    const kmh = asKmh(parse(text, unit), unit);
    const converted = kmh > 0 && isFinite(kmh) ? format(fromKmh(kmh, nextUnit), nextUnit) : text;
    update(converted, nextUnit);
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor="speed" className="block font-medium">Treadmill speed</label>
      <div className="flex gap-2">
        <input
          id="speed"
          name="speed"
          autoComplete="off"
          // Paces need a ":" (5:30), which a number box won't accept.
          type={pace ? "text" : "number"}
          inputMode={pace ? "text" : "decimal"}
          step={pace ? undefined : 0.5}
          min={pace ? undefined : Math.ceil(lo * 2) / 2}
          max={pace ? undefined : Math.floor(hi * 2) / 2}
          placeholder={pace ? "5:30…" : "10…"}
          value={text}
          onChange={(e) => update(e.target.value, unit)}
          aria-invalid={invalid}
          aria-describedby="speed-hint"
          className={`${input} ${invalid ? inputInvalid : ""} w-28`}
        />
        <select
          aria-label="Speed unit"
          value={unit}
          onChange={(e) => changeUnit(e.target.value as SpeedUnit)}
          className={input}
        >
          {Object.entries(UNIT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <p id="speed-hint" aria-live="polite" className={invalid ? "text-body-sm text-red-600" : "text-body-sm text-muted"}>
        {invalid ? `Enter a ${pace ? "pace" : "speed"} between ${range}.` : `Between ${range}. Keep the same speed for every scan.`}
      </p>
    </div>
  );
}
