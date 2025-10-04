/**
 * Context-Aware Extraction
 * 
 * Extracts values based on textual proximity to keywords.
 * Useful when structured data is missing but contextual clues exist.
 * 
 * Example:
 *   Text: "Référence fabricant : 23572714"
 *         ↑ keyword (distance: 0)    ↑ value (distance: 2 tokens)
 */

import type { Result } from "../types/result.ts";
import { fail, ok } from "../types/result.ts";

/**
 * Token with position information
 */
export interface Token {
  text: string;
  position: number;      // Character position in original text
  index: number;         // Token index in array
}

/**
 * Context match with scoring
 */
export interface ContextMatch {
  value: string;         // Extracted value
  keyword: string;       // Keyword that triggered the match
  distance: number;      // Distance in tokens from keyword
  confidence: number;    // Confidence score (0-1)
  position: number;      // Character position in text
  rawText: string;       // Surrounding context
}

/**
 * Options for context extraction
 */
export interface ContextExtractionOptions {
  /** Window size in tokens (default: 10) */
  windowSize?: number;
  
  /** Case sensitive matching (default: false) */
  caseSensitive?: boolean;
  
  /** Maximum distance for matches (default: windowSize) */
  maxDistance?: number;
  
  /** Minimum confidence threshold (default: 0.3) */
  minConfidence?: number;
}

/**
 * Tokenize text with position tracking
 * 
 * @param text - Text to tokenize
 * @returns Array of tokens with positions
 */
export function tokenizeWithPositions(text: string): Token[] {
  const tokens: Token[] = [];
  const regex = /\S+/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      text: match[0],
      position: match.index,
      index: tokens.length,
    });
  }
  
  return tokens;
}

/**
 * Find keyword positions in tokens
 * 
 * @param tokens - Tokenized text
 * @param keywords - Keywords to find
 * @param caseSensitive - Case sensitive matching
 * @returns Array of keyword token indices
 */
export function findKeywordPositions(
  tokens: Token[],
  keywords: string[],
  caseSensitive = false,
): number[] {
  const positions: number[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const tokenText = caseSensitive ? tokens[i].text : tokens[i].text.toLowerCase();
    
    for (const keyword of keywords) {
      const keywordText = caseSensitive ? keyword : keyword.toLowerCase();
      
      if (tokenText.includes(keywordText)) {
        positions.push(i);
        break;
      }
    }
  }
  
  return positions;
}

/**
 * Extract context window around position
 * 
 * @param tokens - Tokenized text
 * @param centerIndex - Center token index
 * @param windowSize - Window size in tokens
 * @returns Tokens in window
 */
export function extractWindow(
  tokens: Token[],
  centerIndex: number,
  windowSize: number,
): Token[] {
  const start = Math.max(0, centerIndex - windowSize);
  const end = Math.min(tokens.length, centerIndex + windowSize + 1);
  
  return tokens.slice(start, end);
}

/**
 * Calculate confidence based on distance
 * 
 * Distance 0-2: confidence 0.9-1.0 (very close)
 * Distance 3-5: confidence 0.7-0.9 (close)
 * Distance 6-10: confidence 0.4-0.7 (far)
 * Distance >10: confidence 0.2-0.4 (very far)
 * 
 * @param distance - Distance in tokens
 * @param maxDistance - Maximum distance
 * @returns Confidence score (0-1)
 */
export function calculateDistanceConfidence(
  distance: number,
  maxDistance: number,
): number {
  if (distance <= 2) return 1.0 - (distance * 0.05);
  if (distance <= 5) return 0.9 - ((distance - 2) * 0.067);
  if (distance <= 10) return 0.7 - ((distance - 5) * 0.06);
  
  // Exponential decay for far distances
  const ratio = distance / maxDistance;
  return Math.max(0.2, 0.4 * Math.exp(-ratio * 2));
}

/**
 * Extract value by context (generic)
 * 
 * @param text - Text to search
 * @param keywords - Keywords to search for
 * @param pattern - Regex pattern for values
 * @param options - Extraction options
 * @returns Context matches
 * 
 * @example
 * ```ts
 * const [err, matches] = extractByContext(
 *   "Référence fabricant : 23572714",
 *   ["référence", "ref"],
 *   /\d{8}/g
 * );
 * // matches[0].value === "23572714"
 * // matches[0].distance === 2
 * ```
 */
export function extractByContext(
  text: string,
  keywords: string[],
  pattern: RegExp,
  options: ContextExtractionOptions = {},
): Result<ContextMatch[]> {
  try {
    const windowSize = options.windowSize ?? 10;
    const caseSensitive = options.caseSensitive ?? false;
    const maxDistance = options.maxDistance ?? windowSize;
    const minConfidence = options.minConfidence ?? 0.3;
    
    // Tokenize text
    const tokens = tokenizeWithPositions(text);
    
    // Find keyword positions
    const keywordPositions = findKeywordPositions(tokens, keywords, caseSensitive);
    
    if (keywordPositions.length === 0) {
      return ok([]);
    }
    
    // Find matches in windows around keywords
    const matches: ContextMatch[] = [];
    const seenValues = new Set<string>();
    
    for (const keywordPos of keywordPositions) {
      const window = extractWindow(tokens, keywordPos, windowSize);
      const windowText = window.map((t) => t.text).join(" ");
      
      // Find all pattern matches in window
      const patternMatches = Array.from(windowText.matchAll(pattern));
      
      for (const match of patternMatches) {
        const value = match[0];
        
        // Skip if already seen (avoid duplicates)
        if (seenValues.has(value)) continue;
        seenValues.add(value);
        
        // Find token index of match
        let matchTokenIndex = -1;
        let charCount = 0;
        
        for (let i = 0; i < window.length; i++) {
          if (charCount === match.index || 
              (charCount < (match.index ?? 0) && charCount + window[i].text.length > (match.index ?? 0))) {
            matchTokenIndex = window[i].index;
            break;
          }
          charCount += window[i].text.length + 1; // +1 for space
        }
        
        if (matchTokenIndex === -1) continue;
        
        // Calculate distance and confidence
        const distance = Math.abs(matchTokenIndex - keywordPos);
        
        if (distance > maxDistance) continue;
        
        const confidence = calculateDistanceConfidence(distance, maxDistance);
        
        if (confidence < minConfidence) continue;
        
        // Extract raw context
        const contextStart = Math.max(0, keywordPos - 3);
        const contextEnd = Math.min(tokens.length, matchTokenIndex + 3);
        const rawText = tokens.slice(contextStart, contextEnd).map((t) => t.text).join(" ");
        
        matches.push({
          value,
          keyword: tokens[keywordPos].text,
          distance,
          confidence,
          position: tokens[matchTokenIndex].position,
          rawText,
        });
      }
    }
    
    // Sort by confidence (highest first)
    matches.sort((a, b) => b.confidence - a.confidence);
    
    return ok(matches);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract price by context
 * 
 * @param text - Text to search
 * @param options - Extraction options
 * @returns Price matches
 * 
 * @example
 * ```ts
 * const [err, matches] = extractPriceByContext("Prix: 120.00 EUR");
 * // matches[0].value === "120.00"
 * ```
 */
export function extractPriceByContext(
  text: string,
  options: ContextExtractionOptions = {},
): Result<ContextMatch[]> {
  const keywords = [
    "prix", "price", "coût", "cost", "tarif", "montant", "amount",
    "€", "EUR", "$", "USD", "£", "GBP",
  ];
  
  const pricePattern = /\d+[.,]\d{2}/g;
  
  return extractByContext(text, keywords, pricePattern, options);
}

/**
 * Extract reference by context
 * 
 * @param text - Text to search
 * @param options - Extraction options
 * @returns Reference matches
 */
export function extractReferenceByContext(
  text: string,
  options: ContextExtractionOptions = {},
): Result<ContextMatch[]> {
  const keywords = [
    "référence", "ref", "reference", "sku", "part", "numéro", "number",
    "code", "article", "produit", "product", "item",
  ];
  
  const refPattern = /[A-Z0-9]{4,20}/g;
  
  return extractByContext(text, keywords, refPattern, options);
}

/**
 * Extract weight by context
 * 
 * @param text - Text to search
 * @param options - Extraction options
 * @returns Weight matches
 */
export function extractWeightByContext(
  text: string,
  options: ContextExtractionOptions = {},
): Result<ContextMatch[]> {
  const keywords = [
    "poids", "weight", "masse", "mass", "pesée",
    "kg", "kilogramme", "gramme", "g", "lb", "pound",
  ];
  
  const weightPattern = /\d+[.,]?\d*\s*(?:kg|g|lb|oz)/gi;
  
  return extractByContext(text, keywords, weightPattern, options);
}

/**
 * Extract dimensions by context
 * 
 * @param text - Text to search
 * @param options - Extraction options
 * @returns Dimension matches
 */
export function extractDimensionsByContext(
  text: string,
  options: ContextExtractionOptions = {},
): Result<ContextMatch[]> {
  const keywords = [
    "dimensions", "taille", "size", "longueur", "length",
    "largeur", "width", "hauteur", "height", "profondeur", "depth",
    "cm", "mm", "m", "in", "inch",
  ];
  
  const dimPattern = /\d+\s*[x×]\s*\d+(?:\s*[x×]\s*\d+)?\s*(?:mm|cm|m|in)/gi;
  
  return extractByContext(text, keywords, dimPattern, options);
}

/**
 * Extract brand by context
 * 
 * @param text - Text to search
 * @param options - Extraction options
 * @returns Brand matches
 */
export function extractBrandByContext(
  text: string,
  options: ContextExtractionOptions = {},
): Result<ContextMatch[]> {
  const keywords = [
    "marque", "brand", "fabricant", "manufacturer", "constructeur",
    "par", "by", "de", "from",
  ];
  
  // Brand pattern: capitalized words
  const brandPattern = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g;
  
  return extractByContext(text, keywords, brandPattern, {
    ...options,
    caseSensitive: true, // Brands are case-sensitive
  });
}

/**
 * Extract all contextual data
 * 
 * @param text - Text to search
 * @param options - Extraction options
 * @returns Object with all extracted data
 */
export function extractAllByContext(
  text: string,
  options: ContextExtractionOptions = {},
): Result<{
  prices: ContextMatch[];
  references: ContextMatch[];
  weights: ContextMatch[];
  dimensions: ContextMatch[];
  brands: ContextMatch[];
}> {
  try {
    const [priceErr, prices] = extractPriceByContext(text, options);
    const [refErr, references] = extractReferenceByContext(text, options);
    const [weightErr, weights] = extractWeightByContext(text, options);
    const [dimErr, dimensions] = extractDimensionsByContext(text, options);
    const [brandErr, brands] = extractBrandByContext(text, options);
    
    return ok({
      prices: priceErr ? [] : prices,
      references: refErr ? [] : references,
      weights: weightErr ? [] : weights,
      dimensions: dimErr ? [] : dimensions,
      brands: brandErr ? [] : brands,
    });
  } catch (error) {
    return fail(error);
  }
}
