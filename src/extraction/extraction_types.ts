/**
 * Types for product data extraction
 *
 * This module defines all types related to extracting product information
 * from HTML pages, including normalization, multi-source fusion, and evidence tracking.
 */

/**
 * Extraction method used to obtain data
 */
export type ExtractionMethod =
  | "jsonld" // JSON-LD structured data
  | "microdata" // Schema.org microdata
  | "opengraph" // Open Graph protocol
  | "pattern" // Regex pattern matching
  | "context" // Context-aware extraction (proximity)
  | "semantic"; // Semantic extraction (tables, lists)

/**
 * Complete product information
 */
export interface ProductInfo {
  // === Identifiers ===

  /** Product reference/SKU/EAN */
  reference?: string;

  /** Stock Keeping Unit */
  sku?: string;

  /** European Article Number (13 digits) */
  ean?: string;

  /** Global Trade Item Number (8, 12, 13, or 14 digits) */
  gtin13?: string;
  gtin14?: string;

  // === Basic Information ===

  /** Product name/title */
  name?: string;

  /** Brand name */
  brand?: string;

  /** Model number/name */
  model?: string;

  /** Product category */
  category?: string;

  /** Product description */
  description?: string;

  // === Price (normalized) ===

  /** Price information (normalized to smallest unit) */
  price?: Money;

  // === Physical Characteristics (normalized SI) ===

  /** Weight (normalized to grams) */
  weight?: Weight;

  /** Dimensions (normalized to millimeters) */
  dimensions?: Dimensions;

  /** Battery/energy capacity */
  battery?: BatteryInfo;

  // === Availability ===

  /** Stock availability status */
  availability?:
    | "in_stock"
    | "out_of_stock"
    | "preorder"
    | "discontinued"
    | "unknown";

  /** Available quantity in stock */
  stockQuantity?: number;

  // === Images ===

  /** Product images */
  images?: ProductImage[];

  // === Additional Metadata ===

  /** Product condition */
  condition?: "new" | "used" | "refurbished" | "unknown";

  /** Warranty information */
  warranty?: string;

  /** Color */
  color?: string;

  /** Size (clothing, etc.) */
  size?: string;

  /** Material */
  material?: string;

  // === Extraction Metadata ===

  /** Methods used to extract this data */
  extractionMethods: ExtractionMethod[];

  /** Overall confidence score (0-1) */
  confidence: number;
}

/**
 * Monetary value (normalized)
 */
export interface Money {
  /** Amount in smallest unit (e.g., cents for EUR/USD) */
  amount: number;

  /** Currency code (ISO 4217: EUR, USD, GBP, etc.) */
  currency: string;

  /** Original extracted value (before normalization) */
  originalValue: string;

  /** Confidence score for this extraction (0-1) */
  confidence: number;
}

/**
 * Weight information (normalized to grams)
 */
export interface Weight {
  /** Weight value in grams */
  value: number;

  /** Unit after normalization (always 'g') */
  unit: "g";

  /** Original extracted value */
  originalValue: string;

  /** Original unit (kg, g, lb, oz, etc.) */
  originalUnit: string;
}

/**
 * Dimensions (normalized to millimeters)
 */
export interface Dimensions {
  /** Length in millimeters */
  length?: number;

  /** Width in millimeters */
  width?: number;

  /** Height in millimeters */
  height?: number;

  /** Diameter in millimeters (for circular items) */
  diameter?: number;

  /** Unit after normalization (always 'mm') */
  unit: "mm";

  /** Original extracted value (e.g., "30 x 20 x 10 cm") */
  originalValue: string;
}

/**
 * Battery/energy information
 */
export interface BatteryInfo {
  /** Capacity in mAh */
  capacity: number;

  /** Voltage in V */
  voltage?: number;

  /** Power in W */
  power?: number;

  /** Battery type (Li-ion, NiMH, etc.) */
  type?: string;
}

/**
 * Product image information
 */
export interface ProductImage {
  /** Image URL */
  url: string;

  /** Alt text */
  alt?: string;

  /** Image width in pixels */
  width?: number;

  /** Image height in pixels */
  height?: number;

  /** Is this the primary/main product image? */
  isPrimary: boolean;
}

/**
 * Evidence for an extracted field
 * Provides full traceability of where data came from
 */
export interface ExtractionEvidence {
  /** Field name (e.g., "price", "reference") */
  field: string;

  /** Extracted value */
  value: unknown;

  /** Source method used */
  source: ExtractionMethod;

  /** Confidence for this specific extraction (0-1) */
  confidence: number;

  /** Location in DOM (XPath or CSS selector) */
  location?: string;

  /** Raw text that was extracted (before normalization) */
  rawText?: string;

  /** Additional context */
  context?: string;
}

/**
 * Options for product extraction
 */
export interface ExtractionOptions {
  /** Enable JSON-LD extraction (default: true) */
  enableJsonLd?: boolean;

  /** Enable microdata extraction (default: true) */
  enableMicrodata?: boolean;

  /** Enable Open Graph extraction (default: true) */
  enableOpenGraph?: boolean;

  /** Enable pattern matching extraction (default: true) */
  enablePatterns?: boolean;

  /** Enable context-aware extraction (default: true) */
  enableContext?: boolean;

  /** Enable semantic extraction from tables/lists (default: true) */
  enableSemantic?: boolean;

  /** Default currency if not detected (default: 'EUR') */
  defaultCurrency?: string;

  /** Default language for patterns (default: 'fr') */
  defaultLanguage?: "fr" | "en" | "es" | "de";
}

/**
 * Pattern match result
 */
export interface PatternMatch {
  /** Pattern name/identifier */
  pattern: string;

  /** Matched value */
  value: string;

  /** Position in text (character offset) */
  position: number;

  /** Confidence score (0-1) */
  confidence: number;

  /** Captured groups from regex */
  groups?: Record<string, string>;
}

/**
 * Structured data extracted from page
 */
export interface StructuredData {
  /** Type of structured data */
  type: "jsonld" | "microdata" | "opengraph" | "unknown";

  /** Confidence score (0-1) */
  confidence: number;

  /** Raw extracted data */
  data: Record<string, unknown>;

  /** Location in document */
  location?: string;
}

/**
 * Result of multi-source data fusion
 */
export interface FusionResult {
  /** Merged product data */
  merged: ProductInfo;

  /** All evidence from all sources */
  evidence: ExtractionEvidence[];

  /** Conflicts detected during fusion */
  conflicts: DataConflict[];
}

/**
 * Represents a conflict between data sources
 */
export interface DataConflict {
  /** Field name where conflict occurred */
  field: string;

  /** Conflicting values from different sources */
  values: Array<{
    value: unknown;
    source: ExtractionMethod;
    confidence: number;
  }>;
  
  /** How the conflict was resolved */
  resolution:
    | "highest_confidence"
    | "highest_priority"
    | "average"
    | "first"
    | "manual";
  
  /** Final value after resolution */
  resolvedValue: unknown;
}
