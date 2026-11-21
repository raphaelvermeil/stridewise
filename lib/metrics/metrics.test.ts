import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { angleAt } from "./angles.ts";
import { cadence, groundContacts } from "./cadence.ts";
import { analyze } from "./index.ts";

const clip1 = JSON.parse(readFileSync("fixtures/landmarks/clip1.json", "utf8"));
const p = (x: number, y: number) => ({ x, y, z: 0, visibility: 1 });

test("angleAt", () => {
  assert.equal(Math.round(angleAt(p(1, 0), p(0, 0), p(0, 1))), 90);
  assert.equal(Math.round(angleAt(p(-1, 0), p(0, 0), p(1, 0))), 180);
  assert.equal(Math.round(angleAt(p(1, 1), p(0, 0), p(1, 0))), 45);
});

// clip1: 21.2 s side-view treadmill run, runner faces left. 62 steps per MediaPipe — TODO confirm with manual count.
test("cadence clip1", () => {
  const { spm, contactFrames } = cadence(clip1);
  assert.ok(Math.abs(spm - 180) <= 5, `spm ${spm}`);
  assert.ok(Math.abs(contactFrames.length - 62) <= 1, `steps ${contactFrames.length}`);
});

test("groundContacts clip1 finds one contact per step", () => {
  const n = groundContacts(clip1).length;
  assert.ok(Math.abs(n - 62) <= 2, `contacts ${n}`);
});

// Needs aspect; clip1.json predates it. Re-export clip1 from /dev/landmarks to enable.
test("analyze clip1 returns finite metrics", { skip: !clip1[0].aspect && "re-export clip1 with aspect" }, () => {
  const m = analyze(clip1);
  for (const [k, v] of Object.entries(m)) assert.ok(Number.isFinite(v), `${k} = ${v}`);
  assert.ok(Math.abs(m.cadenceSpm - 180) <= 5);
});
