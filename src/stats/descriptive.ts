import { Result, ok, fail } from "../types/result.ts";
import { DescriptiveStats } from "./types.ts";
import { ascending, isFiniteNumber, safeDivide } from "./utils.ts";

export function computeMean(values: number[]): Result<number> {
  try {
    const filtered = values.filter(isFiniteNumber);
    const count = filtered.length;
    if (count === 0) return ok(NaN);
    const sum = filtered.reduce((acc, val) => acc + val, 0);
    return ok(sum / count);
  } catch (error) {
    return fail<number>(error);
  }
}

export function computeMedian(values: number[]): Result<number> {
  try {
    const sorted = values.filter(isFiniteNumber).slice().sort(ascending);
    const n = sorted.length;
    if (n === 0) return ok(NaN);
    const mid = Math.floor(n / 2);
    if (n % 2 === 0) return ok((sorted[mid - 1] + sorted[mid]) / 2);
    return ok(sorted[mid]);
  } catch (error) {
    return fail<number>(error);
  }
}

export function computeModes(values: number[]): Result<number[]> {
  try {
    const filtered = values.filter(isFiniteNumber);
    if (filtered.length === 0) return ok([]);
    const frequency = new Map<number, number>();
    for (const v of filtered) {
      frequency.set(v, (frequency.get(v) ?? 0) + 1);
    }
    let maxFreq = 0;
    for (const f of frequency.values()) maxFreq = Math.max(maxFreq, f);
    const modes: number[] = [];
    for (const [v, f] of frequency.entries()) {
      if (f === maxFreq) modes.push(v);
    }
    modes.sort(ascending);
    return ok(modes);
  } catch (error) {
    return fail<number[]>(error);
  }
}

export function computeVariance(values: number[]): Result<number> {
  try {
    const filtered = values.filter(isFiniteNumber);
    const n = filtered.length;
    if (n === 0) return ok(NaN);
    const mean = filtered.reduce((acc, v) => acc + v, 0) / n;
    const variance = filtered.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
    return ok(variance);
  } catch (error) {
    return fail<number>(error);
  }
}

export function computeStandardDeviation(values: number[]): Result<number> {
  try {
    const [err, variance] = computeVariance(values);
    if (err) return fail<number>(err);
    return ok(Math.sqrt(variance));
  } catch (error) {
    return fail<number>(error);
  }
}

export function computeQuantile(values: number[], q: number): Result<number> {
  try {
    if (!Number.isFinite(q) || q < 0 || q > 1) return ok(NaN);
    const sorted = values.filter(isFiniteNumber).slice().sort(ascending);
    const n = sorted.length;
    if (n === 0) return ok(NaN);
    const pos = (n - 1) * q;
    const lower = Math.floor(pos);
    const upper = Math.ceil(pos);
    if (lower === upper) return ok(sorted[lower]);
    const weight = pos - lower;
    return ok(sorted[lower] * (1 - weight) + sorted[upper] * weight);
  } catch (error) {
    return fail<number>(error);
  }
}

export function computeSummary(values: number[]): Result<DescriptiveStats> {
  try {
    const filtered = values.filter(isFiniteNumber);
    const count = filtered.length;
    const sum = filtered.reduce((acc, v) => acc + v, 0);

    const [eMean, mean] = computeMean(filtered);
    if (eMean) return fail<DescriptiveStats>(eMean);
    const [eMedian, median] = computeMedian(filtered);
    if (eMedian) return fail<DescriptiveStats>(eMedian);
    const [eModes, modes] = computeModes(filtered);
    if (eModes) return fail<DescriptiveStats>(eModes);
    const [eVar, variance] = computeVariance(filtered);
    if (eVar) return fail<DescriptiveStats>(eVar);
    const [eStd, standardDeviation] = computeStandardDeviation(filtered);
    if (eStd) return fail<DescriptiveStats>(eStd);
    const min = filtered.length ? Math.min(...filtered) : NaN;
    const max = filtered.length ? Math.max(...filtered) : NaN;
    const [eQ1, q1] = computeQuantile(filtered, 0.25);
    if (eQ1) return fail<DescriptiveStats>(eQ1);
    const [eQ3, q3] = computeQuantile(filtered, 0.75);
    if (eQ3) return fail<DescriptiveStats>(eQ3);

    return ok({
      count,
      sum,
      mean,
      median,
      modes,
      variance,
      standardDeviation,
      min,
      max,
      q1,
      q3,
    });
  } catch (error) {
    return fail<DescriptiveStats>(error);
  }
}


