/**
 * Pattern Matcher
 * 
 * Extracts product data from text using regex patterns with confidence scoring.
 */

import type { Result } from "../types/result.ts";
import { fail, ok } from "../types/result.ts";
import type { PatternMatch } from "./extraction_types.ts";
import {
  AVAILABILITY_PATTERNS,
  BRAND_PATTERNS,
  CONDITION_PATTERNS,
  DIMENSION_PATTERNS,
  MODEL_PATTERNS,
  PRICE_PATTERNS,
  REFERENCE_PATTERNS,
  WEIGHT_PATTERNS,
} from "./patterns.ts";
import { normalizeDimension, normalizePrice, normalizeWeight, parsePrice } from "./normalizer.ts";

/**
 * Find all pattern matches in text
 * 
 * @param text - Text to search
 * @param patterns - Record of pattern name to RegExp
 * @returns Matches grouped by pattern name
 */
export function findPatterns(
  text: string,
  patterns: Record<string, RegExp>,
): Result<Record<string, PatternMatch[]>> {
  try {
    const results: Record<string, PatternMatch[]> = {};

    for (const [name, pattern] of Object.entries(patterns)) {
      const matches: PatternMatch[] = [];
      
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      
      let match;
      while ((match = pattern.exec(text)) !== null) {
        matches.push({
          pattern: name,
          value: match[0],
          position: match.index,
          confidence: 0.7, // Base confidence for pattern matches
          groups: match.groups,
        });
      }

      if (matches.length > 0) {
        results[name] = matches;
      }
    }

    return ok(results);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract price from text (auto-detect best match)
 * 
 * @param text - Text to search
 * @returns Most likely price with confidence
 */
export function extractPrice(text: string): Result<{
  amount: number;
  currency: string;
  originalValue: string;
  confidence: number;
} | null> {
  try {
    const candidates: Array<{
      amount: number;
      currency: string;
      originalValue: string;
      confidence: number;
    }> = [];

    // Try all price patterns
    for (const [name, pattern] of Object.entries(PRICE_PATTERNS)) {
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        const value = match[1] || match[0];
        
        // Infer currency from pattern name
        let currency = "EUR"; // default
        if (name.includes("USD")) currency = "USD";
        else if (name.includes("GBP")) currency = "GBP";
        else if (name.includes("CHF")) currency = "CHF";
        
        const [err, money] = normalizePrice(value, currency);
        if (!err) {
          let confidence = 0.7;
          
          // Boost confidence for labeled prices
          if (name.includes("LABELED")) confidence = 0.9;
          if (name.includes("TTC") || name.includes("HT")) confidence = 0.95;
          
          candidates.push({
            amount: money.amount,
            currency: money.currency,
            originalValue: match[0],
            confidence,
          });
        }
      }
    }

    if (candidates.length === 0) {
      return ok(null);
    }

    // Return the most confident match
    candidates.sort((a, b) => b.confidence - a.confidence);
    return ok(candidates[0]);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract product reference/SKU from text
 * 
 * @param text - Text to search
 * @returns Most likely reference or null
 */
export function extractReference(text: string): Result<string | null> {
  try {
    const candidates: Array<{ value: string; confidence: number }> = [];

    for (const [name, pattern] of Object.entries(REFERENCE_PATTERNS)) {
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        const value = match[1];
        
        // Validate reference format (alphanumeric, reasonable length)
        if (value && value.length >= 4 && value.length <= 20) {
          let confidence = 0.7;
          
          // Boost confidence for specific patterns
          if (name.includes("SKU")) confidence = 0.95;
          if (name.includes("EAN") || name.includes("GTIN")) confidence = 1.0;
          if (name.includes("LABELED")) confidence = 0.9;
          
          candidates.push({ value, confidence });
        }
      }
    }

    if (candidates.length === 0) {
      return ok(null);
    }

    // Return the most confident match
    candidates.sort((a, b) => b.confidence - a.confidence);
    return ok(candidates[0].value);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract weight from text
 * 
 * @param text - Text to search
 * @returns Weight in grams or null
 */
export function extractWeight(text: string): Result<{
  value: number;
  unit: "g";
  originalValue: string;
  originalUnit: string;
  confidence: number;
} | null> {
  try {
    const candidates: Array<{
      value: number;
      unit: "g";
      originalValue: string;
      originalUnit: string;
      confidence: number;
    }> = [];

    for (const [name, pattern] of Object.entries(WEIGHT_PATTERNS)) {
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        const value = match[1];
        
        // Infer unit from pattern name
        let unit = "g";
        if (name.includes("KG")) unit = "kg";
        else if (name.includes("LB")) unit = "lb";
        else if (name.includes("OZ")) unit = "oz";
        
        const [err, weight] = normalizeWeight(value, unit);
        if (!err) {
          let confidence = 0.7;
          
          // Boost confidence for labeled weights
          if (name.includes("LABELED")) confidence = 0.9;
          
          candidates.push({
            value: weight.value,
            unit: weight.unit,
            originalValue: match[0],
            originalUnit: unit,
            confidence,
          });
        }
      }
    }

    if (candidates.length === 0) {
      return ok(null);
    }

    // Return the most confident match
    candidates.sort((a, b) => b.confidence - a.confidence);
    return ok(candidates[0]);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract dimensions from text
 * 
 * @param text - Text to search
 * @returns Dimensions in millimeters or null
 */
export function extractDimensions(text: string): Result<{
  length?: number;
  width?: number;
  height?: number;
  unit: "mm";
  originalValue: string;
  confidence: number;
} | null> {
  try {
    const candidates: Array<{
      length?: number;
      width?: number;
      height?: number;
      unit: "mm";
      originalValue: string;
      confidence: number;
    }> = [];

    // Try 3D dimensions first
    for (const [name, pattern] of Object.entries(DIMENSION_PATTERNS)) {
      if (!name.includes("3D")) continue;
      
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        const [_, length, width, height] = match;
        
        // Infer unit from pattern name
        let unit = "mm";
        if (name.includes("CM")) unit = "cm";
        else if (name.includes("_M")) unit = "m";
        
        const [lenErr, lengthMm] = normalizeDimension(length, unit);
        const [widthErr, widthMm] = normalizeDimension(width, unit);
        const [heightErr, heightMm] = normalizeDimension(height, unit);
        
        if (!lenErr && !widthErr && !heightErr) {
          candidates.push({
            length: lengthMm,
            width: widthMm,
            height: heightMm,
            unit: "mm",
            originalValue: match[0],
            confidence: 0.9, // 3D dimensions are very specific
          });
        }
      }
    }

    if (candidates.length === 0) {
      return ok(null);
    }

    // Return the most confident match
    candidates.sort((a, b) => b.confidence - a.confidence);
    return ok(candidates[0]);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract brand from text
 * 
 * @param text - Text to search
 * @returns Brand name or null
 */
export function extractBrand(text: string): Result<string | null> {
  try {
    for (const [name, pattern] of Object.entries(BRAND_PATTERNS)) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      
      if (match && match[1]) {
        return ok(match[1].trim());
      }
    }

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract model from text
 * 
 * @param text - Text to search
 * @returns Model name or null
 */
export function extractModel(text: string): Result<string | null> {
  try {
    for (const [name, pattern] of Object.entries(MODEL_PATTERNS)) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      
      if (match && match[1]) {
        return ok(match[1].trim());
      }
    }

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract condition from text
 * 
 * @param text - Text to search
 * @returns Condition (new, used, refurbished) or null
 */
export function extractCondition(
  text: string,
): Result<"new" | "used" | "refurbished" | null> {
  try {
    const textLower = text.toLowerCase();

    // Check for refurbished first (most specific)
    if (CONDITION_PATTERNS.REFURBISHED_FR.test(textLower) ||
        CONDITION_PATTERNS.REFURBISHED_EN.test(textLower)) {
      return ok("refurbished");
    }

    // Check for new
    if (CONDITION_PATTERNS.NEW_FR.test(textLower) ||
        CONDITION_PATTERNS.NEW_EN.test(textLower)) {
      return ok("new");
    }

    // Check for used
    if (CONDITION_PATTERNS.USED_FR.test(textLower) ||
        CONDITION_PATTERNS.USED_EN.test(textLower)) {
      return ok("used");
    }

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract availability from text
 * 
 * @param text - Text to search
 * @returns Availability status or null
 */
export function extractAvailability(
  text: string,
): Result<"in_stock" | "out_of_stock" | "preorder" | null> {
  try {
    const textLower = text.toLowerCase();

    // Check for out of stock first
    if (AVAILABILITY_PATTERNS.OUT_OF_STOCK_FR.test(textLower) ||
        AVAILABILITY_PATTERNS.OUT_OF_STOCK_EN.test(textLower)) {
      return ok("out_of_stock");
    }

    // Check for preorder
    if (AVAILABILITY_PATTERNS.PREORDER_FR.test(textLower) ||
        AVAILABILITY_PATTERNS.PREORDER_EN.test(textLower)) {
      return ok("preorder");
    }

    // Check for in stock
    if (AVAILABILITY_PATTERNS.IN_STOCK_FR.test(textLower) ||
        AVAILABILITY_PATTERNS.IN_STOCK_EN.test(textLower)) {
      return ok("in_stock");
    }

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}
