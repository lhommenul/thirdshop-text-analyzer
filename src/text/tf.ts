import { Result, ok, fail } from "../types/result.ts";
import { tokenize, stripHtml } from "./tokenize.ts";

export interface TermFrequencyOptions {
  asRelative?: boolean; // true => tf = count / totalTokens, false => raw counts
  normalizeHtml?: boolean; // strip HTML tags before tokenization
  minTokenLength?: number;
}

const DEFAULT_TF_OPTS: Required<TermFrequencyOptions> = {
  asRelative: true,
  normalizeHtml: true,
  minTokenLength: 2,
};

export type TermFrequency = Record<string, number>;

export function termFrequency(text: string, options: TermFrequencyOptions = {}): Result<TermFrequency> {
  try {
    const opts = { ...DEFAULT_TF_OPTS, ...options };
    let prepared = text ?? "";
    if (opts.normalizeHtml) {
      const [stripErr, stripped] = stripHtml(prepared);
      if (stripErr) return fail<TermFrequency>(stripErr);
      prepared = stripped;
    }
    const [tokErr, tokens] = tokenize(prepared, { minTokenLength: opts.minTokenLength });
    if (tokErr) return fail<TermFrequency>(tokErr);
    const counts: TermFrequency = {};
    for (const t of tokens) counts[t] = (counts[t] ?? 0) + 1;
    if (opts.asRelative) {
      const total = tokens.length || 1;
      for (const k of Object.keys(counts)) counts[k] = counts[k] / total;
    }
    return ok(counts);
  } catch (error) {
    return fail<TermFrequency>(error);
  }
}


