/**
 * Tests for unit normalizer
 */

import { assertEquals } from "@std/assert";
import {
  normalizePrice,
  normalizeWeight,
  normalizeDimension,
  normalizeDimensions3D,
  normalizeBatteryCapacity,
  parsePrice,
} from "./normalizer.ts";

Deno.test("normalizePrice - EUR with dot", () => {
  const [err, money] = normalizePrice("120.50", "EUR");
  
  assertEquals(err, null);
  assertEquals(money?.amount, 12050);
  assertEquals(money?.currency, "EUR");
  assertEquals(money?.originalValue, "120.50");
  assertEquals(money?.confidence, 1.0);
});

Deno.test("normalizePrice - EUR with comma (European format)", () => {
  const [err, money] = normalizePrice("99,99", "EUR");
  
  assertEquals(err, null);
  assertEquals(money?.amount, 9999);
  assertEquals(money?.currency, "EUR");
});

Deno.test("normalizePrice - USD with $ symbol", () => {
  const [err, money] = normalizePrice("49.99", "$");
  
  assertEquals(err, null);
  assertEquals(money?.amount, 4999);
  assertEquals(money?.currency, "USD");
});

Deno.test("normalizePrice - GBP with £ symbol", () => {
  const [err, money] = normalizePrice("79.50", "£");
  
  assertEquals(err, null);
  assertEquals(money?.amount, 7950);
  assertEquals(money?.currency, "GBP");
});

Deno.test("normalizePrice - numeric input", () => {
  const [err, money] = normalizePrice(150.75, "EUR");
  
  assertEquals(err, null);
  assertEquals(money?.amount, 15075);
});

Deno.test("normalizePrice - invalid value", () => {
  const [err, money] = normalizePrice("invalid", "EUR");
  
  assertEquals(err !== null, true);
  assertEquals(money, null);
});

Deno.test("normalizeWeight - kilograms to grams", () => {
  const [err, weight] = normalizeWeight("2.5", "kg");
  
  assertEquals(err, null);
  assertEquals(weight?.value, 2500);
  assertEquals(weight?.unit, "g");
  assertEquals(weight?.originalValue, "2.5");
  assertEquals(weight?.originalUnit, "kg");
});

Deno.test("normalizeWeight - grams", () => {
  const [err, weight] = normalizeWeight(500, "g");
  
  assertEquals(err, null);
  assertEquals(weight?.value, 500);
  assertEquals(weight?.unit, "g");
});

Deno.test("normalizeWeight - pounds to grams", () => {
  const [err, weight] = normalizeWeight("1", "lb");
  
  assertEquals(err, null);
  assertEquals(weight?.value, 454); // rounded 453.592
  assertEquals(weight?.unit, "g");
});

Deno.test("normalizeDimension - centimeters to millimeters", () => {
  const [err, mm] = normalizeDimension("30", "cm");
  
  assertEquals(err, null);
  assertEquals(mm, 300);
});

Deno.test("normalizeDimension - meters to millimeters", () => {
  const [err, mm] = normalizeDimension("1.5", "m");
  
  assertEquals(err, null);
  assertEquals(mm, 1500);
});

Deno.test("normalizeDimension - millimeters", () => {
  const [err, mm] = normalizeDimension(250, "mm");
  
  assertEquals(err, null);
  assertEquals(mm, 250);
});

Deno.test("normalizeDimension - inches to millimeters", () => {
  const [err, mm] = normalizeDimension("10", "in");
  
  assertEquals(err, null);
  assertEquals(mm, 254); // rounded 25.4 * 10
});

Deno.test("normalizeDimensions3D - complete", () => {
  const [err, dims] = normalizeDimensions3D(
    "30",
    "20",
    "10",
    "cm",
    "30 x 20 x 10 cm"
  );
  
  assertEquals(err, null);
  assertEquals(dims?.length, 300);
  assertEquals(dims?.width, 200);
  assertEquals(dims?.height, 100);
  assertEquals(dims?.unit, "mm");
  assertEquals(dims?.originalValue, "30 x 20 x 10 cm");
});

Deno.test("normalizeBatteryCapacity - mAh", () => {
  const [err, capacity] = normalizeBatteryCapacity(3000, "mAh");
  
  assertEquals(err, null);
  assertEquals(capacity, 3000);
});

Deno.test("normalizeBatteryCapacity - Ah to mAh", () => {
  const [err, capacity] = normalizeBatteryCapacity("3", "Ah");
  
  assertEquals(err, null);
  assertEquals(capacity, 3000);
});

Deno.test("parsePrice - auto-detect EUR symbol", () => {
  const [err, money] = parsePrice("120.50 €");
  
  assertEquals(err, null);
  assertEquals(money?.amount, 12050);
  assertEquals(money?.currency, "EUR");
  assertEquals(money?.confidence, 0.9);
});

Deno.test("parsePrice - auto-detect USD symbol", () => {
  const [err, money] = parsePrice("$99.99");
  
  assertEquals(err, null);
  assertEquals(money?.amount, 9999);
  assertEquals(money?.currency, "USD");
});

Deno.test("parsePrice - no price found", () => {
  const [err, money] = parsePrice("No price here");
  
  assertEquals(err, null);
  assertEquals(money, null);
});
