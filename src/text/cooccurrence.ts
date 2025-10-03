import { Result, ok, fail } from "../types/result.ts";
import { tokenize, stripHtml } from "./tokenize.ts";
import { CooccurrenceMatrix, CooccurrenceOptions, PairScore } from "./cooccurrence_types.ts";

const DEFAULT_OPTS: Required<CooccurrenceOptions> = {
  windowSize: 2,
  symmetric: true,
  distanceWeighting: false,
  normalizeHtml: true,
  minTokenLength: 2,
};

function addToMatrix(matrix: CooccurrenceMatrix, a: string, b: string, value: number): void {
  if (!matrix[a]) matrix[a] = {};
  matrix[a][b] = (matrix[a][b] ?? 0) + value;
}

export function buildCooccurrenceMatrix(text: string, options: CooccurrenceOptions = {}): Result<CooccurrenceMatrix> {
  try {
    const opts = { ...DEFAULT_OPTS, ...options };
    let prepared = text ?? "";
    if (opts.normalizeHtml) {
      const [stripErr, stripped] = stripHtml(prepared);
      if (stripErr) return fail<CooccurrenceMatrix>(stripErr);
      prepared = stripped;
    }
    const [tokErr, tokens] = tokenize(prepared, { minTokenLength: opts.minTokenLength });
    if (tokErr) return fail<CooccurrenceMatrix>(tokErr);

    const matrix: CooccurrenceMatrix = {};
    const n = tokens.length;
    for (let i = 0; i < n; i++) {
      const term = tokens[i];
      const left = Math.max(0, i - opts.windowSize);
      const right = Math.min(n - 1, i + opts.windowSize);
      for (let j = left; j <= right; j++) {
        if (j === i) continue;
        const neighbor = tokens[j];
        const distance = Math.abs(j - i);
        const w = opts.distanceWeighting ? 1 / distance : 1;
        addToMatrix(matrix, term, neighbor, w);
        if (opts.symmetric) addToMatrix(matrix, neighbor, term, w);
      }
    }
    return ok(matrix);
  } catch (error) {
    return fail<CooccurrenceMatrix>(error);
  }
}

export function mostAssociated(matrix: CooccurrenceMatrix, term: string, k: number): PairScore[] {
  const row = matrix[term] ?? {};
  const entries = Object.entries(row) as PairScore[];
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, Math.max(0, k));
}

// Pointwise Mutual Information and Positive PMI
export function computePPMI(matrix: CooccurrenceMatrix): Result<CooccurrenceMatrix> {
  try {
    // compute totals
    let total = 0;
    const rowTotals = new Map<string, number>();
    const colTotals = new Map<string, number>();
    for (const [rowTerm, row] of Object.entries(matrix)) {
      for (const [colTerm, count] of Object.entries(row)) {
        total += count;
        rowTotals.set(rowTerm, (rowTotals.get(rowTerm) ?? 0) + count);
        colTotals.set(colTerm, (colTotals.get(colTerm) ?? 0) + count);
      }
    }
    const ppmi: CooccurrenceMatrix = {};
    for (const [rowTerm, row] of Object.entries(matrix)) {
      for (const [colTerm, count] of Object.entries(row)) {
        const pxy = count / total;
        const px = (rowTotals.get(rowTerm) ?? 0) / total;
        const py = (colTotals.get(colTerm) ?? 0) / total;
        const denom = px * py;
        let pmi = 0;
        if (denom > 0 && pxy > 0) pmi = Math.log(pxy / denom);
        if (pmi > 0) addToMatrix(ppmi, rowTerm, colTerm, pmi);
      }
    }
    return ok(ppmi);
  } catch (error) {
    return fail<CooccurrenceMatrix>(error);
  }
}


