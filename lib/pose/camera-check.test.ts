import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkCamera } from "./camera-check.ts";

// Fixture frames carry `aspect`; the 9:16 default only applies to old exports without it.
const clip1 = JSON.parse(readFileSync("fixtures/landmarks/2026-11-21_session-1.json", "utf8")).map((f: any) => ({ aspect: 9 / 16, ...f }));

test("real side-view clip passes on most frames", () => {
  const passed = clip1.filter((f: any) => checkCamera(f).ok).length;
  assert.ok(passed / clip1.length > 0.8, `passed ${passed}/${clip1.length}`);
});

test("no person", () => {
  assert.equal(checkCamera(null).ok, false);
});

test("facing the camera fails side-on check", () => {
  const f = structuredClone(clip1[0]);
  f.landmarks[11].x = 0.4; // spread the shoulders apart, as if facing the camera
  f.landmarks[12].x = 0.6;
  assert.deepEqual(checkCamera(f).problems, ["Turn sideways so your side faces the camera."]);
});

test("missing ankles fails whole-body check", () => {
  const f = structuredClone(clip1[0]);
  f.landmarks[27].visibility = 0.1;
  f.landmarks[28].visibility = 0.1;
  assert.match(checkCamera(f).problems[0], /ankles/);
});
