import { Result, ok, fail } from "../types/result.ts";
import { termFrequency, TermFrequency } from "./tf.ts";
import { idfFromDocs, IdfScores } from "./idf.ts";

export interface TfidfOptions {
  tfRelative?: boolean; // if true, TF uses relative frequency; else raw counts
  idfSmooth?: boolean; // if true, enables smoothing in IDF
  logBase?: number; // base for logarithm in IDF
  normalizeHtml?: boolean; // strip HTML before tokenization
  minTokenLength?: number; // min token length during tokenize
}

const DEFAULT_TFIDF_OPTS: Required<TfidfOptions> = {
  tfRelative: false,
  idfSmooth: true,
  logBase: Math.E,
  normalizeHtml: true,
  minTokenLength: 2,
};

export type TfidfVector = Record<string, number>;

function multiplyTfByIdf(tf: TermFrequency, idf: IdfScores): TfidfVector {
  const scores: TfidfVector = {};
  for (const term of Object.keys(tf)) {
    const idfValue = idf[term];
    if (idfValue === undefined) continue;
    scores[term] = tf[term] * idfValue;
  }
  return scores;
}

export function tfidfFromDocs(documents: string[], options: TfidfOptions = {}): Result<TfidfVector[]> {
  try {
    const opts = { ...DEFAULT_TFIDF_OPTS, ...options };
    const [idfErr, idf] = idfFromDocs(documents, {
      smooth: opts.idfSmooth,
      logBase: opts.logBase,
      normalizeHtml: opts.normalizeHtml,
      minTokenLength: opts.minTokenLength,
    });
    if (idfErr) return fail<TfidfVector[]>(idfErr);

    const vectors: TfidfVector[] = [];
    for (const doc of documents) {
      const [tfErr, tf] = termFrequency(doc, {
        asRelative: opts.tfRelative,
        normalizeHtml: opts.normalizeHtml,
        minTokenLength: opts.minTokenLength,
      });
      if (tfErr) return fail<TfidfVector[]>(tfErr);
      vectors.push(multiplyTfByIdf(tf, idf));
    }
    return ok(vectors);
  } catch (error) {
    return fail<TfidfVector[]>(error);
  }
}

export function topKTerms(vector: TfidfVector, k: number): Array<[string, number]> {
  const entries = Object.entries(vector);
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, Math.max(0, k));
}


