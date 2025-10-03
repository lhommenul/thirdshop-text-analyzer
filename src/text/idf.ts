import { Result, ok, fail } from "../types/result.ts";
import { tokenize, stripHtml } from "./tokenize.ts";

export interface IdfOptions {
  logBase?: number; // default e (Math.E)
  smooth?: boolean; // if true, use 1 + N in numerator and 1 + df in denominator (adds-one)
  normalizeHtml?: boolean; // strip HTML before tokenize
  minTokenLength?: number;
}

const DEFAULT_IDF_OPTS: Required<IdfOptions> = {
  logBase: Math.E,
  smooth: true,
  normalizeHtml: true,
  minTokenLength: 2,
};

export type Document = string;
export type IdfScores = Record<string, number>;

function computeDocumentFrequency(docsTokens: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  for (const tokens of docsTokens) {
    const unique = new Set(tokens);
    for (const t of unique) df.set(t, (df.get(t) ?? 0) + 1);
  }
  return df;
}

export function idfFromDocs(documents: Document[], options: IdfOptions = {}): Result<IdfScores> {
  try {
    const opts = { ...DEFAULT_IDF_OPTS, ...options };
    const docsTokens: string[][] = [];
    for (const doc of documents) {
      let prepared = doc ?? "";
      if (opts.normalizeHtml) {
        const [stripErr, stripped] = stripHtml(prepared);
        if (stripErr) return fail<IdfScores>(stripErr);
        prepared = stripped;
      }
      const [tokErr, tokens] = tokenize(prepared, { minTokenLength: opts.minTokenLength });
      if (tokErr) return fail<IdfScores>(tokErr);
      docsTokens.push(tokens);
    }

    const N = docsTokens.length;
    const df = computeDocumentFrequency(docsTokens);
    const scores: IdfScores = {};
    const log = (x: number) => (opts.logBase === Math.E ? Math.log(x) : Math.log(x) / Math.log(opts.logBase));

    for (const [term, dfi] of df.entries()) {
      if (opts.smooth) {
        // idf_smooth = log(1 + N / (1 + df)) + 1 (add 1 to keep positive)
        scores[term] = log(1 + N / (1 + dfi)) + 1;
      } else {
        // classic idf = log(N / df)
        scores[term] = dfi > 0 ? log(N / dfi) : 0;
      }
    }
    return ok(scores);
  } catch (error) {
    return fail<IdfScores>(error);
  }
}


