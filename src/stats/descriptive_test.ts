import { assertAlmostEquals, assertEquals } from "@std/assert";
import { computeMedian, computeMean, computeModes, computeSummary } from "./descriptive.ts";

Deno.test("computeMean basic", () => {
  const [err, mean] = computeMean([1, 2, 3, 4]);
  if (err) throw err;
  assertAlmostEquals(mean, 2.5);
});

Deno.test("computeMedian odd/even", () => {
  const [e1, m1] = computeMedian([3, 1, 2]);
  if (e1) throw e1;
  assertEquals(m1, 2);
  const [e2, m2] = computeMedian([3, 1, 2, 4]);
  if (e2) throw e2;
  assertEquals(m2, 2.5);
});

Deno.test("computeModes multi", () => {
  const [err, modes] = computeModes([1, 1, 2, 2, 3]);
  if (err) throw err;
  assertEquals(modes, [1, 2]);
});

Deno.test("computeSummary full", () => {
  const data = [2, 4, 4, 4, 5, 5, 7, 9];
  const [err, summary] = computeSummary(data);
  if (err) throw err;
  assertEquals(summary.count, 8);
  assertEquals(summary.sum, 40);
  assertAlmostEquals(summary.mean, 5);
  assertEquals(summary.median, 4.5);
  assertEquals(summary.modes, [4]);
  assertAlmostEquals(summary.variance, 4);
  assertAlmostEquals(summary.standardDeviation, 2);
  assertEquals(summary.min, 2);
  assertEquals(summary.max, 9);
});


