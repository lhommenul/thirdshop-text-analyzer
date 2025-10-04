/**
 * Unit Normalizer
 * 
 * Normalizes prices, weights, dimensions to standard units:
 * - Prices → cents/smallest unit + ISO 4217 currency code
 * - Weights → grams
 * - Dimensions → millimeters
 * - Battery capacity → mAh
 */

import type { Result } from "../types/result.ts";
import { fail, ok } from "../types/result.ts";
import type { Dimensions, Money, Weight } from "./extraction_types.ts";

/**
 * Currency symbols to ISO 4217 codes
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  "€": "EUR",
  "$": "USD",
  "£": "GBP",
  "¥": "JPY",
  "₣": "CHF",
  "₹": "INR",
  "₽": "RUB",
  "₺": "TRY",
  "元": "CNY",
};

/**
 * ISO 4217 currency codes to decimal places
 */
const CURRENCY_DECIMALS: Record<string, number> = {
  "EUR": 2,
  "USD": 2,
  "GBP": 2,
  "CHF": 2,
  "JPY": 0, // Yen has no decimals
  "KRW": 0, // Won has no decimals
  "INR": 2,
  "CNY": 2,
};

/**
 * Normalize price to smallest unit (cents) with ISO 4217 currency
 * 
 * @param value - Price value as string or number
 * @param currency - Currency symbol or ISO code
 * @returns Normalized Money object
 * 
 * @example
 * ```ts
 * const [err, money] = normalizePrice("120.50", "€");
 * // money = { amount: 12050, currency: "EUR", originalValue: "120.50", confidence: 1.0 }
 * 
 * const [err2, money2] = normalizePrice("99,99", "EUR");
 * // money2 = { amount: 9999, currency: "EUR", originalValue: "99,99", confidence: 1.0 }
 * ```
 */
export function normalizePrice(
  value: string | number,
  currency?: string,
): Result<Money> {
  try {
    const originalValue = String(value);
    
    // Parse numeric value
    let numericValue: number;
    if (typeof value === "number") {
      numericValue = value;
    } else {
      // Replace comma with dot for parsing (European format)
      const cleaned = value.replace(/\s/g, "").replace(/,/g, ".");
      numericValue = parseFloat(cleaned);
    }

    if (isNaN(numericValue)) {
      return fail(new Error(`Invalid price value: ${value}`));
    }

    // Normalize currency code
    let currencyCode = "EUR"; // default
    if (currency) {
      currencyCode = CURRENCY_SYMBOLS[currency] || currency.toUpperCase();
    }

    // Validate currency code
    if (!currencyCode.match(/^[A-Z]{3}$/)) {
      return fail(new Error(`Invalid currency code: ${currencyCode}`));
    }

    // Get decimal places for currency
    const decimals = CURRENCY_DECIMALS[currencyCode] ?? 2;
    const multiplier = Math.pow(10, decimals);
    
    // Convert to smallest unit (cents)
    const amount = Math.round(numericValue * multiplier);

    const result: Money = {
      amount,
      currency: currencyCode,
      originalValue,
      confidence: 1.0,
    };

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Normalize weight to grams
 * 
 * @param value - Weight value as string or number
 * @param unit - Unit (kg, g, lb, oz)
 * @returns Normalized Weight object
 * 
 * @example
 * ```ts
 * const [err, weight] = normalizeWeight("2.5", "kg");
 * // weight = { value: 2500, unit: "g", originalValue: "2.5", originalUnit: "kg" }
 * 
 * const [err2, weight2] = normalizeWeight(500, "g");
 * // weight2 = { value: 500, unit: "g", originalValue: "500", originalUnit: "g" }
 * ```
 */
export function normalizeWeight(
  value: string | number,
  unit: string,
): Result<Weight> {
  try {
    const originalValue = String(value);
    const originalUnit = unit.toLowerCase();
    
    // Parse numeric value
    let numericValue: number;
    if (typeof value === "number") {
      numericValue = value;
    } else {
      const cleaned = value.replace(/\s/g, "").replace(/,/g, ".");
      numericValue = parseFloat(cleaned);
    }

    if (isNaN(numericValue)) {
      return fail(new Error(`Invalid weight value: ${value}`));
    }

    // Conversion factors to grams
    const conversions: Record<string, number> = {
      "g": 1,
      "kg": 1000,
      "lb": 453.592,
      "lbs": 453.592,
      "oz": 28.3495,
      "mg": 0.001,
      "t": 1000000,
      "ton": 1000000,
      "tonne": 1000000,
    };

    const factor = conversions[originalUnit];
    if (!factor) {
      return fail(new Error(`Unknown weight unit: ${unit}`));
    }

    const valueInGrams = Math.round(numericValue * factor);

    const result: Weight = {
      value: valueInGrams,
      unit: "g",
      originalValue,
      originalUnit,
    };

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Normalize dimension to millimeters
 * 
 * @param value - Dimension value as string or number
 * @param unit - Unit (mm, cm, m, in)
 * @returns Value in millimeters
 * 
 * @example
 * ```ts
 * const [err, mm] = normalizeDimension("30", "cm");
 * // mm = 300
 * 
 * const [err2, mm2] = normalizeDimension(1.5, "m");
 * // mm2 = 1500
 * ```
 */
export function normalizeDimension(
  value: string | number,
  unit: string,
): Result<number> {
  try {
    // Parse numeric value
    let numericValue: number;
    if (typeof value === "number") {
      numericValue = value;
    } else {
      const cleaned = value.replace(/\s/g, "").replace(/,/g, ".");
      numericValue = parseFloat(cleaned);
    }

    if (isNaN(numericValue)) {
      return fail(new Error(`Invalid dimension value: ${value}`));
    }

    // Conversion factors to millimeters
    const conversions: Record<string, number> = {
      "mm": 1,
      "cm": 10,
      "dm": 100,
      "m": 1000,
      "in": 25.4,
      "inch": 25.4,
      "inches": 25.4,
      '"': 25.4,
      "ft": 304.8,
      "foot": 304.8,
      "feet": 304.8,
      "'": 304.8,
    };

    const unitLower = unit.toLowerCase();
    const factor = conversions[unitLower];
    
    if (!factor) {
      return fail(new Error(`Unknown dimension unit: ${unit}`));
    }

    const valueInMm = Math.round(numericValue * factor);
    return ok(valueInMm);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Normalize 3D dimensions (L x W x H) to millimeters
 * 
 * @param length - Length value
 * @param width - Width value
 * @param height - Height value
 * @param unit - Unit for all dimensions
 * @param originalValue - Original string representation
 * @returns Normalized Dimensions object
 * 
 * @example
 * ```ts
 * const [err, dims] = normalizeDimensions3D("30", "20", "10", "cm", "30 x 20 x 10 cm");
 * // dims = { length: 300, width: 200, height: 100, unit: "mm", originalValue: "30 x 20 x 10 cm" }
 * ```
 */
export function normalizeDimensions3D(
  length: string | number,
  width: string | number,
  height: string | number,
  unit: string,
  originalValue: string,
): Result<Dimensions> {
  try {
    const [lenErr, lengthMm] = normalizeDimension(length, unit);
    if (lenErr) return fail(lenErr);
    
    const [widthErr, widthMm] = normalizeDimension(width, unit);
    if (widthErr) return fail(widthErr);
    
    const [heightErr, heightMm] = normalizeDimension(height, unit);
    if (heightErr) return fail(heightErr);

    const result: Dimensions = {
      length: lengthMm,
      width: widthMm,
      height: heightMm,
      unit: "mm",
      originalValue,
    };

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Normalize battery capacity to mAh
 * 
 * @param value - Capacity value
 * @param unit - Unit (mAh, Ah, Wh)
 * @returns Capacity in mAh
 * 
 * @example
 * ```ts
 * const [err, capacity] = normalizeBatteryCapacity("3", "Ah");
 * // capacity = 3000 (mAh)
 * 
 * const [err2, capacity2] = normalizeBatteryCapacity(5000, "mAh");
 * // capacity2 = 5000 (mAh)
 * ```
 */
export function normalizeBatteryCapacity(
  value: string | number,
  unit: string,
): Result<number> {
  try {
    // Parse numeric value
    let numericValue: number;
    if (typeof value === "number") {
      numericValue = value;
    } else {
      const cleaned = value.replace(/\s/g, "").replace(/,/g, ".");
      numericValue = parseFloat(cleaned);
    }

    if (isNaN(numericValue)) {
      return fail(new Error(`Invalid battery capacity value: ${value}`));
    }

    // Conversion factors to mAh
    const conversions: Record<string, number> = {
      "mah": 1,
      "ah": 1000,
      "wh": 1000, // Approximate (needs voltage for exact conversion)
    };

    const unitLower = unit.toLowerCase();
    const factor = conversions[unitLower];
    
    if (!factor) {
      return fail(new Error(`Unknown battery capacity unit: ${unit}`));
    }

    const capacityInMah = Math.round(numericValue * factor);
    return ok(capacityInMah);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Parse and normalize a price string (auto-detect currency)
 * 
 * @param text - Price string (e.g., "120.50 €", "$99.99")
 * @returns Normalized Money object
 * 
 * @example
 * ```ts
 * const [err, money] = parsePrice("120.50 €");
 * // money = { amount: 12050, currency: "EUR", originalValue: "120.50 €", confidence: 0.9 }
 * ```
 */
export function parsePrice(text: string): Result<Money | null> {
  try {
    // Try to extract price and currency from text
    const patterns = [
      { regex: /(\d+(?:[.,]\d{2})?)\s*€/, currency: "€" },
      { regex: /\$\s*(\d+(?:[.,]\d{2})?)/, currency: "$" },
      { regex: /£\s*(\d+(?:[.,]\d{2})?)/, currency: "£" },
      { regex: /(\d+(?:[.,]\d{2})?)\s*(EUR|USD|GBP|CHF)/i, currency: null },
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        const value = match[1];
        const currency = pattern.currency || (match[2] ? match[2].toUpperCase() : undefined);
        
        const [err, money] = normalizePrice(value, currency);
        if (!err) {
          return ok({ ...money, confidence: 0.9 }); // Slightly lower confidence for auto-detected
        }
      }
    }

    return ok(null); // No price found
  } catch (error) {
    return fail(error);
  }
}
