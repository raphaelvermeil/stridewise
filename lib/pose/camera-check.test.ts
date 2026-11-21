import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkCamera } from "./camera-check.ts";

// clip1.json was exported before frames had `aspect`; the body proportions say it is a portrait (9:16) phone clip.
const clip1 = JSON.parse(readFileSync("fixtures/landmarks/clip1.json", "utf8")).map((f: any) => ({ aspect: 9 / 16, ...f }));

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
