/**
 * Schema Parser
 * 
 * Extracts and normalizes product data from structured formats:
 * - JSON-LD (Schema.org)
 * - Microdata (Schema.org)
 * - Open Graph Protocol
 */

import type { Result } from "../types/result.ts";
import { fail, ok } from "../types/result.ts";
import type {
  ExtractionEvidence,
  ProductInfo,
  StructuredData,
} from "./extraction_types.ts";
import { normalizePrice } from "./normalizer.ts";
import { extractJsonLd, extractMicrodata, extractOpenGraph } from "../html/parser.ts";

// deno-lint-ignore no-explicit-any
type DOMDocument = any;

/**
 * Extract all structured data from parsed document
 * 
 * @param document - Parsed HTML document
 * @returns Array of structured data from all sources
 */
export function extractAllStructuredData(
  document: DOMDocument,
): Result<StructuredData[]> {
  try {
    const structuredData: StructuredData[] = [];

    // Extract JSON-LD
    const [jsonLdErr, jsonLdData] = extractJsonLd(document);
    if (!jsonLdErr && jsonLdData) {
      for (const item of jsonLdData) {
        structuredData.push({
          type: "jsonld",
          confidence: item.confidence,
          data: item.data as Record<string, unknown>,
          location: 'script[type="application/ld+json"]',
        });
      }
    }

    // Extract Microdata
    const [microdataErr, microdataItems] = extractMicrodata(document);
    if (!microdataErr && microdataItems) {
      for (const item of microdataItems) {
        structuredData.push({
          type: "microdata",
          confidence: item.confidence,
          data: item.properties as Record<string, unknown>,
          location: "[itemscope]",
        });
      }
    }

    // Extract Open Graph
    const [ogErr, ogData] = extractOpenGraph(document);
    if (!ogErr && ogData && Object.keys(ogData).length > 0) {
      structuredData.push({
        type: "opengraph",
        confidence: 0.8,
        data: ogData as Record<string, unknown>,
        location: 'meta[property^="og:"]',
      });
    }

    return ok(structuredData);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract product info from JSON-LD data
 * 
 * @param jsonLd - JSON-LD data object
 * @returns Partial ProductInfo with evidence
 */
export function extractFromJsonLd(
  jsonLd: Record<string, unknown>,
): Result<{
  product: Partial<ProductInfo>;
  evidence: ExtractionEvidence[];
}> {
  try {
    const product: Partial<ProductInfo> = {};
    const evidence: ExtractionEvidence[] = [];

    // Check if this is a Product type
    const type = jsonLd["@type"];
    if (type !== "Product" && !Array.isArray(type) || 
        (Array.isArray(type) && !type.includes("Product"))) {
      return ok({ product, evidence });
    }

    // Extract name
    if (jsonLd.name && typeof jsonLd.name === "string") {
      product.name = jsonLd.name;
      evidence.push({
        field: "name",
        value: jsonLd.name,
        source: "jsonld",
        confidence: 1.0,
        location: "@type=Product > name",
      });
    }

    // Extract SKU
    if (jsonLd.sku && typeof jsonLd.sku === "string") {
      product.sku = jsonLd.sku;
      product.reference = jsonLd.sku;
      evidence.push({
        field: "sku",
        value: jsonLd.sku,
        source: "jsonld",
        confidence: 1.0,
        location: "@type=Product > sku",
      });
    }

    // Extract GTIN
    if (jsonLd.gtin13 && typeof jsonLd.gtin13 === "string") {
      product.gtin13 = jsonLd.gtin13;
      evidence.push({
        field: "gtin13",
        value: jsonLd.gtin13,
        source: "jsonld",
        confidence: 1.0,
      });
    }

    if (jsonLd.gtin14 && typeof jsonLd.gtin14 === "string") {
      product.gtin14 = jsonLd.gtin14;
    }

    // Extract brand
    if (jsonLd.brand) {
      let brandName: string | undefined;
      
      if (typeof jsonLd.brand === "string") {
        brandName = jsonLd.brand;
      } else if (typeof jsonLd.brand === "object" && jsonLd.brand !== null) {
        const brand = jsonLd.brand as Record<string, unknown>;
        if (brand.name && typeof brand.name === "string") {
          brandName = brand.name;
        }
      }

      if (brandName) {
        product.brand = brandName;
        evidence.push({
          field: "brand",
          value: brandName,
          source: "jsonld",
          confidence: 1.0,
        });
      }
    }

    // Extract description
    if (jsonLd.description && typeof jsonLd.description === "string") {
      product.description = jsonLd.description;
    }

    // Extract category
    if (jsonLd.category && typeof jsonLd.category === "string") {
      product.category = jsonLd.category;
    }

    // Extract offers (price, availability)
    if (jsonLd.offers) {
      const offers = Array.isArray(jsonLd.offers) ? jsonLd.offers : [jsonLd.offers];
      
      for (const offer of offers) {
        if (typeof offer !== "object" || offer === null) continue;
        const offerObj = offer as Record<string, unknown>;

        // Extract price
        if (offerObj.price) {
          const priceValue = String(offerObj.price);
          const currency = offerObj.priceCurrency ? String(offerObj.priceCurrency) : "EUR";
          
          const [priceErr, money] = normalizePrice(priceValue, currency);
          if (!priceErr) {
            product.price = money;
            evidence.push({
              field: "price",
              value: money,
              source: "jsonld",
              confidence: 1.0,
              rawText: `${priceValue} ${currency}`,
              location: "@type=Product > offers > price",
            });
          }
        }

        // Extract availability
        if (offerObj.availability && typeof offerObj.availability === "string") {
          const availability = offerObj.availability.toLowerCase();
          if (availability.includes("instock")) {
            product.availability = "in_stock";
          } else if (availability.includes("outofstock")) {
            product.availability = "out_of_stock";
          } else if (availability.includes("preorder")) {
            product.availability = "preorder";
          } else if (availability.includes("discontinued")) {
            product.availability = "discontinued";
          }
        }
      }
    }

    // Extract weight
    if (jsonLd.weight) {
      const weight = jsonLd.weight as Record<string, unknown>;
      if (weight.value && weight.unitCode) {
        // Schema.org uses UN/CEFACT codes (e.g., "KGM" for kg)
        const unitCodeMap: Record<string, string> = {
          "KGM": "kg",
          "GRM": "g",
          "LBR": "lb",
          "ONZ": "oz",
        };
        
        const unit = unitCodeMap[String(weight.unitCode)] || "g";
        // Weight extraction would go through normalizeWeight
      }
    }

    // Extract images
    if (jsonLd.image) {
      const images = Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image];
      product.images = images.map((img, index) => ({
        url: typeof img === "string" ? img : (img as Record<string, unknown>).url as string,
        isPrimary: index === 0,
      })).filter((img) => img.url);
    }

    // Mark extraction methods
    if (Object.keys(product).length > 0) {
      product.extractionMethods = ["jsonld"];
      product.confidence = 1.0;
    }

    return ok({ product, evidence });
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract product info from microdata
 * 
 * @param microdata - Microdata properties
 * @returns Partial ProductInfo with evidence
 */
export function extractFromMicrodata(
  microdata: Record<string, unknown>,
): Result<{
  product: Partial<ProductInfo>;
  evidence: ExtractionEvidence[];
}> {
  try {
    const product: Partial<ProductInfo> = {};
    const evidence: ExtractionEvidence[] = [];

    // Extract name
    if (microdata.name && typeof microdata.name === "string") {
      product.name = microdata.name;
      evidence.push({
        field: "name",
        value: microdata.name,
        source: "microdata",
        confidence: 0.9,
      });
    }

    // Extract price
    if (microdata.price) {
      const priceValue = String(microdata.price);
      const currency = microdata.priceCurrency ? String(microdata.priceCurrency) : "EUR";
      
      const [priceErr, money] = normalizePrice(priceValue, currency);
      if (!priceErr) {
        product.price = money;
        evidence.push({
          field: "price",
          value: money,
          source: "microdata",
          confidence: 0.9,
        });
      }
    }

    // Extract SKU
    if (microdata.sku && typeof microdata.sku === "string") {
      product.sku = microdata.sku;
      product.reference = microdata.sku;
    }

    // Extract brand
    if (microdata.brand && typeof microdata.brand === "string") {
      product.brand = microdata.brand;
    }

    // Extract description
    if (microdata.description && typeof microdata.description === "string") {
      product.description = microdata.description;
    }

    // Mark extraction methods
    if (Object.keys(product).length > 0) {
      product.extractionMethods = ["microdata"];
      product.confidence = 0.9;
    }

    return ok({ product, evidence });
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract product info from Open Graph data
 * 
 * @param openGraph - Open Graph properties
 * @returns Partial ProductInfo with evidence
 */
export function extractFromOpenGraph(
  openGraph: Record<string, string>,
): Result<{
  product: Partial<ProductInfo>;
  evidence: ExtractionEvidence[];
}> {
  try {
    const product: Partial<ProductInfo> = {};
    const evidence: ExtractionEvidence[] = [];

    // Check if this is a product
    if (openGraph["og:type"] !== "product") {
      return ok({ product, evidence });
    }

    // Extract title (name)
    if (openGraph["og:title"]) {
      product.name = openGraph["og:title"];
      evidence.push({
        field: "name",
        value: openGraph["og:title"],
        source: "opengraph",
        confidence: 0.8,
      });
    }

    // Extract description
    if (openGraph["og:description"]) {
      product.description = openGraph["og:description"];
    }

    // Extract price
    if (openGraph["product:price:amount"]) {
      const priceValue = openGraph["product:price:amount"];
      const currency = openGraph["product:price:currency"] || "EUR";
      
      const [priceErr, money] = normalizePrice(priceValue, currency);
      if (!priceErr) {
        product.price = money;
        evidence.push({
          field: "price",
          value: money,
          source: "opengraph",
          confidence: 0.8,
        });
      }
    }

    // Extract reference (retailer item id)
    if (openGraph["product:retailer_item_id"]) {
      product.reference = openGraph["product:retailer_item_id"];
      product.sku = openGraph["product:retailer_item_id"];
    }

    // Extract brand
    if (openGraph["product:brand"]) {
      product.brand = openGraph["product:brand"];
    }

    // Extract condition
    if (openGraph["product:condition"]) {
      const condition = openGraph["product:condition"].toLowerCase();
      if (condition === "new") product.condition = "new";
      else if (condition === "used") product.condition = "used";
      else if (condition === "refurbished") product.condition = "refurbished";
    }

    // Extract availability
    if (openGraph["product:availability"]) {
      const availability = openGraph["product:availability"].toLowerCase();
      if (availability.includes("instock") || availability.includes("in stock")) {
        product.availability = "in_stock";
      } else if (availability.includes("out")) {
        product.availability = "out_of_stock";
      } else if (availability.includes("preorder")) {
        product.availability = "preorder";
      }
    }

    // Extract images
    if (openGraph["og:image"]) {
      product.images = [{
        url: openGraph["og:image"],
        isPrimary: true,
      }];
    }

    // Mark extraction methods
    if (Object.keys(product).length > 0) {
      product.extractionMethods = ["opengraph"];
      product.confidence = 0.8;
    }

    return ok({ product, evidence });
  } catch (error) {
    return fail(error);
  }
}
