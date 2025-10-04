/**
 * Product Extractor - Main Orchestration
 * 
 * Orchestrates multi-source product data extraction with fusion and evidence tracking.
 */

import type { Result } from "../types/result.ts";
import { fail, ok } from "../types/result.ts";
import type {
  ExtractionEvidence,
  ExtractionOptions,
  ProductInfo,
} from "./extraction_types.ts";
import { parseHtml } from "../html/parser.ts";
import {
  extractFromJsonLd,
  extractFromMicrodata,
  extractFromOpenGraph,
} from "./schema_parser.ts";
import {
  extractPrice,
  extractReference,
  extractWeight,
  extractDimensions,
  extractBrand,
  extractModel,
  extractCondition,
  extractAvailability,
} from "./pattern_matcher.ts";
import { normalizeHtml } from "../text/normalize.ts";
import { NormalizationStrategy } from "../text/normalize_types.ts";

/**
 * Extract complete product information from HTML
 * 
 * @param html - HTML string
 * @param options - Extraction options
 * @returns Product info with evidence tracking
 * 
 * @example
 * ```ts
 * const [err, result] = await extractProductInfo(html);
 * if (!err) {
 *   console.log("Product:", result.product.name);
 *   console.log("Confidence:", result.confidence);
 *   console.log("Evidence:", result.evidence.length, "sources");
 * }
 * ```
 */
export function extractProductInfo(
  html: string,
  options: ExtractionOptions = {},
): Result<{
  product: ProductInfo;
  confidence: number;
  evidence: ExtractionEvidence[];
}> {
  try {
    const product: ProductInfo = {
      extractionMethods: [],
      confidence: 0,
    };
    const evidence: ExtractionEvidence[] = [];

    // Parse HTML
    const [parseErr, parsed] = parseHtml(html);
    if (parseErr) return fail(parseErr);

    // Normalize HTML for text extraction
    const [normErr, normalized] = normalizeHtml(html, {
      strategy: NormalizationStrategy.WITH_METADATA,
    });
    if (normErr) return fail(normErr);

    // Extract from structured data sources
    let totalConfidence = 0;
    let sourceCount = 0;

    // 1. JSON-LD (highest priority)
    if (options.enableJsonLd !== false) {
      for (const jsonLdItem of parsed.jsonLd) {
        if (jsonLdItem.type === "Product") {
          const [err, extracted] = extractFromJsonLd(
            jsonLdItem.data as Record<string, unknown>,
          );
          if (!err && extracted) {
            mergeProductData(product, extracted.product);
            evidence.push(...extracted.evidence);
            totalConfidence += 1.0;
            sourceCount++;
            if (!product.extractionMethods.includes("jsonld")) {
              product.extractionMethods.push("jsonld");
            }
          }
        }
      }
    }

    // 2. Microdata (second priority)
    if (options.enableMicrodata !== false) {
      for (const microdataItem of parsed.microdata) {
        if (
          microdataItem.type?.includes("Product") ||
          microdataItem.type?.includes("schema.org/Product")
        ) {
          const [err, extracted] = extractFromMicrodata(microdataItem.properties);
          if (!err && extracted) {
            mergeProductData(product, extracted.product);
            evidence.push(...extracted.evidence);
            totalConfidence += 0.8;
            sourceCount++;
            if (!product.extractionMethods.includes("microdata")) {
              product.extractionMethods.push("microdata");
            }
          }
        }
      }
    }

    // 3. Open Graph (third priority)
    if (options.enableOpenGraph !== false) {
      if (parsed.openGraph["og:type"] === "product") {
        const [err, extracted] = extractFromOpenGraph(parsed.openGraph);
        if (!err && extracted) {
          mergeProductData(product, extracted.product);
          evidence.push(...extracted.evidence);
          totalConfidence += 0.6;
          sourceCount++;
          if (!product.extractionMethods.includes("opengraph")) {
            product.extractionMethods.push("opengraph");
          }
        }
      }
    }

    // 4. Pattern matching (fallback)
    if (options.enablePatterns !== false) {
      const text = normalized.text;

      // Extract price
      const [priceErr, priceData] = extractPrice(text);
      if (!priceErr && priceData) {
        if (!product.price) {
          product.price = {
            amount: priceData.amount,
            currency: priceData.currency,
            originalValue: priceData.originalValue,
            confidence: priceData.confidence,
          };
          evidence.push({
            field: "price",
            value: priceData,
            source: "pattern",
            confidence: priceData.confidence,
            rawText: priceData.originalValue,
          });
          totalConfidence += priceData.confidence * 0.5;
          sourceCount++;
          if (!product.extractionMethods.includes("pattern")) {
            product.extractionMethods.push("pattern");
          }
        }
      }

      // Extract reference
      const [refErr, reference] = extractReference(text);
      if (!refErr && reference) {
        if (!product.reference && !product.sku) {
          product.reference = reference;
          product.sku = reference;
          evidence.push({
            field: "reference",
            value: reference,
            source: "pattern",
            confidence: 0.8,
            rawText: reference,
          });
          totalConfidence += 0.4;
          sourceCount++;
        }
      }

      // Extract weight
      const [weightErr, weightData] = extractWeight(text);
      if (!weightErr && weightData) {
        if (!product.weight) {
          product.weight = weightData;
          evidence.push({
            field: "weight",
            value: weightData,
            source: "pattern",
            confidence: weightData.confidence,
          });
        }
      }

      // Extract dimensions
      const [dimErr, dimensions] = extractDimensions(text);
      if (!dimErr && dimensions) {
        if (!product.dimensions) {
          product.dimensions = dimensions;
          evidence.push({
            field: "dimensions",
            value: dimensions,
            source: "pattern",
            confidence: dimensions.confidence,
          });
        }
      }

      // Extract brand
      const [brandErr, brand] = extractBrand(text);
      if (!brandErr && brand) {
        if (!product.brand) {
          product.brand = brand;
        }
      }

      // Extract model
      const [modelErr, model] = extractModel(text);
      if (!modelErr && model) {
        if (!product.model) {
          product.model = model;
        }
      }

      // Extract condition
      const [condErr, condition] = extractCondition(text);
      if (!condErr && condition) {
        if (!product.condition) {
          product.condition = condition;
        }
      }

      // Extract availability
      const [availErr, availability] = extractAvailability(text);
      if (!availErr && availability) {
        if (!product.availability) {
          product.availability = availability;
        }
      }
    }

    // Calculate overall confidence
    const confidence = sourceCount > 0 ? totalConfidence / sourceCount : 0;
    product.confidence = Math.min(confidence, 1.0);

    return ok({
      product,
      confidence: product.confidence,
      evidence,
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * Merge extracted product data (simple version - no conflict resolution yet)
 * 
 * @param target - Target product to merge into
 * @param source - Source product to merge from
 */
function mergeProductData(
  target: ProductInfo,
  source: Partial<ProductInfo>,
): void {
  // Merge primitive fields (only if target doesn't have them)
  if (!target.name && source.name) target.name = source.name;
  if (!target.brand && source.brand) target.brand = source.brand;
  if (!target.model && source.model) target.model = source.model;
  if (!target.category && source.category) target.category = source.category;
  if (!target.description && source.description) {
    target.description = source.description;
  }

  // Merge identifiers
  if (!target.sku && source.sku) target.sku = source.sku;
  if (!target.reference && source.reference) target.reference = source.reference;
  if (!target.ean && source.ean) target.ean = source.ean;
  if (!target.gtin13 && source.gtin13) target.gtin13 = source.gtin13;
  if (!target.gtin14 && source.gtin14) target.gtin14 = source.gtin14;

  // Merge price (prefer source if higher confidence)
  if (source.price) {
    if (
      !target.price ||
      (source.price.confidence && source.price.confidence > (target.price.confidence || 0))
    ) {
      target.price = source.price;
    }
  }

  // Merge weight
  if (!target.weight && source.weight) target.weight = source.weight;

  // Merge dimensions
  if (!target.dimensions && source.dimensions) {
    target.dimensions = source.dimensions;
  }

  // Merge availability
  if (!target.availability && source.availability) {
    target.availability = source.availability;
  }
  if (!target.stockQuantity && source.stockQuantity) {
    target.stockQuantity = source.stockQuantity;
  }

  // Merge condition
  if (!target.condition && source.condition) target.condition = source.condition;

  // Merge warranty
  if (!target.warranty && source.warranty) target.warranty = source.warranty;

  // Merge color/size/material
  if (!target.color && source.color) target.color = source.color;
  if (!target.size && source.size) target.size = source.size;
  if (!target.material && source.material) target.material = source.material;

  // Merge images (combine arrays)
  if (source.images && source.images.length > 0) {
    if (!target.images) {
      target.images = source.images;
    } else {
      // Add new images that don't exist
      for (const img of source.images) {
        if (!target.images.some((existing) => existing.url === img.url)) {
          target.images.push(img);
        }
      }
    }
  }

  // Merge extraction methods
  if (source.extractionMethods) {
    for (const method of source.extractionMethods) {
      if (!target.extractionMethods.includes(method)) {
        target.extractionMethods.push(method);
      }
    }
  }
}

/**
 * Quick product extraction (only structured data)
 * 
 * @param html - HTML string
 * @returns Product info or null
 */
export function quickExtract(html: string): Result<ProductInfo | null> {
  try {
    const [parseErr, parsed] = parseHtml(html);
    if (parseErr) return fail(parseErr);

    // Try JSON-LD first
    for (const jsonLdItem of parsed.jsonLd) {
      if (jsonLdItem.type === "Product") {
        const [err, extracted] = extractFromJsonLd(
          jsonLdItem.data as Record<string, unknown>,
        );
        if (!err && extracted) {
          return ok(extracted.product as ProductInfo);
        }
      }
    }

    // Try Open Graph
    if (parsed.openGraph["og:type"] === "product") {
      const [err, extracted] = extractFromOpenGraph(parsed.openGraph);
      if (!err && extracted) {
        return ok(extracted.product as ProductInfo);
      }
    }

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}
