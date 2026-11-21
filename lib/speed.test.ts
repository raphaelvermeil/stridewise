import { test } from "node:test";
import assert from "node:assert/strict";
import { fromKmh, toKmh } from "./speed.ts";

test("km/h passes through", () => {
  assert.equal(toKmh(10, "kmh"), 10);
});

test("mph converts to km/h", () => {
  assert.equal(toKmh(6, "mph"), 9.7);
});

test("same range in both units", () => {
  assert.equal(toKmh(2.9, "kmh"), null);
  assert.equal(toKmh(25.1, "kmh"), null);
  assert.equal(toKmh(1.8, "mph"), null); // 2.9 km/h
  assert.equal(toKmh(15.6, "mph"), null); // 25.1 km/h
  assert.equal(toKmh(15.5, "mph"), 24.9);
});

test("empty or junk input is rejected", () => {
  assert.equal(toKmh(Number(""), "kmh"), null);
  assert.equal(toKmh(Number("abc"), "kmh"), null);
});

test("switching units and back keeps the same speed", () => {
  const mph = Math.round(fromKmh(10, "mph") * 10) / 10; // 6.2, as shown in the box
  assert.equal(toKmh(mph, "mph"), 10);
});
