import { test } from "node:test";
import assert from "node:assert/strict";
import { computeGoals, type Injury } from "./computeGoals.ts";

test("every goal has min ≤ target ≤ max, for any runner, speed and injury mix", () => {
  const injSets: Injury[][] = [[], ["knee"], ["knee", "shin", "stressFracture"], ["hamstring", "lowBack"], ["achilles", "plantarFascia"], ["hip", "hamstring", "knee"]];
  for (const sex of ["male", "female"] as const)
    for (const fitness of ["beginner", "intermediate", "advanced", "elite"] as const)
      for (const speedKmh of [undefined, 6, 8, 10, 12, 14, 16, 18])
        for (const [heightCm, weightKg] of [[155, 50], [172, 68], [190, 110]])
          for (const age of [18, 40, 70])
            for (const injuries of injSets)
              for (const currentCadenceSpm of [undefined, 150, 185]) {
                const g = computeGoals({ sex, fitness, speedKmh, heightCm, weightKg, age, injuries, currentCadenceSpm });
                for (const [k, v] of Object.entries(g))
                  assert.ok(v.min <= v.target && v.target <= v.max, `${k} ${JSON.stringify(v)} at ${speedKmh} km/h, [${injuries}]`);
              }
});
