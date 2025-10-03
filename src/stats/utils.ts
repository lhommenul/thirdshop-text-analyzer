export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return NaN;
  return numerator / denominator;
}

export function ascending(a: number, b: number): number {
  return a - b;
}


