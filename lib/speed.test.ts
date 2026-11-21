import { test } from "node:test";
import assert from "node:assert/strict";
import { asKmh, format, fromKmh, parse, rangeText, toKmh } from "./speed.ts";

test("km/h passes through", () => {
  assert.equal(toKmh("10", "kmh"), 10);
});

test("mph converts to km/h", () => {
  assert.equal(toKmh("6", "mph"), 9.7);
});

test("pace converts to km/h, typed as m:ss or decimal minutes", () => {
  assert.equal(toKmh("6:00", "minkm"), 10);
  assert.equal(toKmh("5:30", "minkm"), 10.9);
  assert.equal(toKmh("5.5", "minkm"), 10.9);
  assert.equal(toKmh("8:00", "minmi"), 12.1); // 7.5 mph
});

test("same 3-25 km/h range in every unit", () => {
  assert.equal(toKmh("2.9", "kmh"), null);
  assert.equal(toKmh("25.1", "kmh"), null);
  assert.equal(toKmh("1.8", "mph"), null);
  assert.equal(toKmh("15.5", "mph"), 24.9);
  assert.equal(toKmh("2:20", "minkm"), null); // faster than 25 km/h
  assert.equal(toKmh("20:30", "minkm"), null); // slower than 3 km/h
  assert.equal(toKmh("2:24", "minkm"), 25);
  assert.equal(toKmh("20:00", "minkm"), 3);
});

test("range text shown for each unit", () => {
  assert.equal(rangeText("kmh"), "3–25");
  assert.equal(rangeText("mph"), "1.9–15.5");
  assert.equal(rangeText("minkm"), "2:24–20:00");
  assert.equal(rangeText("minmi"), "3:52–32:11");
  // both ends of every range must be accepted
  for (const unit of ["kmh", "mph", "minkm", "minmi"] as const) {
    for (const end of rangeText(unit).split("–")) assert.notEqual(toKmh(end, unit), null, `${end} ${unit}`);
  }
});

test("empty or junk input is rejected", () => {
  for (const unit of ["kmh", "mph", "minkm", "minmi"] as const) {
    assert.equal(toKmh("", unit), null);
    assert.equal(toKmh("abc", unit), null);
    assert.equal(toKmh("0", unit), null);
  }
  assert.equal(toKmh("5:75", "minkm"), null); // 75 seconds is not a valid m:ss
});

test("pace formats as m:ss, carrying 60 seconds", () => {
  assert.equal(format(5.5, "minkm"), "5:30");
  assert.equal(format(5.999, "minkm"), "6:00");
  assert.equal(parse("5:30", "minkm"), 5.5);
});

test("switching through every unit and back keeps the same speed", () => {
  let text = "10";
  let unit: "kmh" | "mph" | "minkm" | "minmi" = "kmh";
  for (const next of ["mph", "minkm", "minmi", "kmh"] as const) {
    text = format(fromKmh(asKmh(parse(text, unit), unit), next), next);
    unit = next;
  }
  assert.equal(toKmh(text, unit), 10);
});
