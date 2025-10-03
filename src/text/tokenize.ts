import { Result, ok, fail } from "../types/result.ts";

export interface TokenizeOptions {
  lowerCase?: boolean;
  preserveApostrophes?: boolean;
  removeDigits?: boolean;
  minTokenLength?: number;
}

const DEFAULT_OPTS: Required<TokenizeOptions> = {
  lowerCase: true,
  preserveApostrophes: false,
  removeDigits: true,
  minTokenLength: 1,
};

export function stripHtml(input: string): Result<string> {
  try {
    // naive HTML strip suitable for dataset usage
    const withoutTags = input.replace(/<[^>]*>/g, " ");
    const normalized = withoutTags.replace(/&nbsp;|&amp;|&lt;|&gt;/g, " ");
    return ok(normalized);
  } catch (error) {
    return fail<string>(error);
  }
}

export function tokenize(input: string, options: TokenizeOptions = {}): Result<string[]> {
  try {
    const opts = { ...DEFAULT_OPTS, ...options };
    let text = input ?? "";
    if (opts.lowerCase) text = text.toLowerCase();
    if (!opts.preserveApostrophes) text = text.replace(/['’`]/g, " ");
    if (opts.removeDigits) text = text.replace(/[0-9]/g, " ");
    // keep letters in any language plus spaces
    text = text.replace(/[^\p{L}\s-]/gu, " ");
    // split on any whitespace or hyphen cluster
    const raw = text.split(/[\s-]+/g);
    const tokens = raw.filter((t) => t.length >= opts.minTokenLength);
    return ok(tokens);
  } catch (error) {
    return fail<string[]>(error);
  }
}


