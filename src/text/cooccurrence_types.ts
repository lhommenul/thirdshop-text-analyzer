export interface CooccurrenceOptions {
  windowSize?: number; // radius around token (e.g., 2 looks 2 left/right)
  symmetric?: boolean; // if true, matrix is symmetric (a,b) and (b,a)
  distanceWeighting?: boolean; // if true, weight by 1/distance
  normalizeHtml?: boolean; // strip HTML tags before tokenization
  minTokenLength?: number; // minimum token length
}

export type CooccurrenceMatrix = Record<string, Record<string, number>>;

export type PairScore = [string, number];


