/**
 * Feature Engineering for Page Classification
 * 
 * Extracts structural, textual, and semantic features from HTML pages
 * to classify them as product pages or non-product pages.
 */

import type { Result } from "../types/result.ts";
import { fail, ok } from "../types/result.ts";
import type { PageFeatures } from "./classification_types.ts";
import { parseHtml } from "../html/parser.ts";
import { extractMainContent, calculateLinkDensity } from "../html/content_extractor.ts";
import { normalizeHtml } from "../text/normalize.ts";
import { NormalizationStrategy } from "../text/normalize_types.ts";
import { filterStopwords, stopwordDensity } from "../text/stopwords_fr.ts";
import { termFrequency } from "../text/tf.ts";
import { ECOMMERCE_KEYWORDS, PRODUCT_KEYWORDS } from "../extraction/patterns.ts";

// deno-lint-ignore no-explicit-any
type DOMDocument = any;
// deno-lint-ignore no-explicit-any
type DOMNode = any;

/**
 * Options for feature extraction
 */
export interface FeatureExtractionOptions {
  /** Include TF-IDF features (default: true) */
  includeTfidf?: boolean;
  
  /** Number of top terms to extract (default: 20) */
  topTermsCount?: number;
  
  /** Language for text analysis (default: 'fr') */
  language?: "fr" | "en" | "all";
}

/**
 * Extract all features from HTML
 * 
 * @param html - HTML string
 * @param normalized - Already normalized HTML (optional, for performance)
 * @param mainContent - Already extracted main content (optional, for performance)
 * @param options - Feature extraction options
 * @returns PageFeatures with all extracted features
 * 
 * @example
 * ```ts
 * const [err, features] = extractFeatures(html);
 * if (!err) {
 *   console.log("Overall score:", features.scores.overallScore);
 *   console.log("Is product page:", features.scores.overallScore >= 5.0);
 * }
 * ```
 */
export function extractFeatures(
  html: string,
  normalized?: { text: string; metadata: unknown },
  mainContent?: { mainContent: string; linkDensity: number; contentDensity: number },
  options: FeatureExtractionOptions = {},
): Result<PageFeatures> {
  try {
    // Parse HTML
    const [parseErr, parsed] = parseHtml(html);
    if (parseErr) return fail(parseErr);

    // Normalize HTML if not provided
    if (!normalized) {
      const [normErr, normResult] = normalizeHtml(html, {
        strategy: NormalizationStrategy.WITH_METADATA,
      });
      if (normErr) return fail(normErr);
      normalized = normResult;
    }

    // Extract main content if not provided
    if (!mainContent) {
      const [contentErr, contentResult] = extractMainContent(parsed.document);
      if (contentErr) return fail(contentErr);
      mainContent = contentResult;
    }

    // Extract features
    const [structErr, structural] = extractStructuralFeatures(parsed.document, parsed);
    if (structErr) return fail(structErr);

    const [textErr, textual] = extractTextualFeatures(
      normalized.text,
      mainContent.mainContent,
      options,
    );
    if (textErr) return fail(textErr);

    const [semErr, semantic] = extractSemanticFeatures(
      parsed.document,
      mainContent.contentDensity,
    );
    if (semErr) return fail(semErr);

    // Calculate scores
    const structuralScore = calculateStructuralScore(structural);
    const textualScore = calculateTextualScore(textual);
    const semanticScore = calculateSemanticScore(semantic);
    
    // Weighted overall score (structural: 50%, textual: 30%, semantic: 20%)
    const overallScore =
      structuralScore * 0.5 +
      textualScore * 0.3 +
      semanticScore * 0.2;

    const features: PageFeatures = {
      structural,
      textual,
      semantic,
      scores: {
        structuralScore,
        textualScore,
        semanticScore,
        overallScore,
      },
    };

    return ok(features);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract structural features from HTML
 * 
 * @param document - Parsed HTML document
 * @param parsed - Parsed document with structured data
 * @returns Structural features
 */
function extractStructuralFeatures(
  document: DOMDocument,
  parsed: { jsonLd: unknown[]; openGraph: Record<string, string> },
): Result<PageFeatures["structural"]> {
  try {
    const features: PageFeatures["structural"] = {
      hasSchemaOrgProduct: false,
      hasOpenGraphProduct: false,
      hasJsonLdProduct: false,
      hasAddToCartButton: false,
      hasBuyButton: false,
      hasProductImages: false,
      hasRatings: false,
      hasPriceDisplay: false,
      imageCount: 0,
      imageHighResCount: 0,
      linkDensity: 0,
      tableCount: 0,
      listCount: 0,
      formCount: 0,
    };

    // Check for Schema.org Product in JSON-LD
    features.hasJsonLdProduct = parsed.jsonLd.some((item: unknown) => {
      // deno-lint-ignore no-explicit-any
      const data = item as any;
      return data.type === "Product" || 
             (Array.isArray(data.type) && data.type.includes("Product"));
    });

    // Check for Open Graph Product
    features.hasOpenGraphProduct = parsed.openGraph["og:type"] === "product";

    // Check for Schema.org in HTML
    const itemScopes = document.querySelectorAll("[itemtype*='Product']");
    features.hasSchemaOrgProduct = itemScopes.length > 0;

    // Check for add-to-cart button
    const addToCartSelectors = [
      "button[class*='add-to-cart']",
      "button[class*='addtocart']",
      "button[id*='add-to-cart']",
      "[data-action='add-to-cart']",
      "button:contains('Ajouter au panier')",
      "input[value*='Ajouter au panier']",
    ];

    for (const selector of addToCartSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          features.hasAddToCartButton = true;
          break;
        }
      } catch {
        // Selector might not be valid, skip
      }
    }

    // Check for buy button
    const buySelectors = [
      "button[class*='buy']",
      "button[class*='acheter']",
      "a[class*='buy']",
      "a[class*='acheter']",
    ];

    for (const selector of buySelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          features.hasBuyButton = true;
          break;
        }
      } catch {
        // Selector might not be valid, skip
      }
    }

    // Check for product images
    const images = document.querySelectorAll("img");
    features.imageCount = images.length;

    let highResCount = 0;
    images.forEach((img: DOMNode) => {
      const width = parseInt(img.getAttribute("width") || "0");
      const height = parseInt(img.getAttribute("height") || "0");
      
      if (width >= 300 && height >= 300) {
        highResCount++;
      }
    });
    features.imageHighResCount = highResCount;
    features.hasProductImages = highResCount > 0;

    // Check for ratings
    const ratingSelectors = [
      "[class*='rating']",
      "[class*='stars']",
      "[class*='review']",
      "[itemprop='aggregateRating']",
      "[itemprop='ratingValue']",
    ];

    for (const selector of ratingSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          features.hasRatings = true;
          break;
        }
      } catch {
        // Selector might not be valid, skip
      }
    }

    // Check for price display
    const priceSelectors = [
      "[class*='price']",
      "[id*='price']",
      "[itemprop='price']",
      "[itemprop='offers']",
    ];

    for (const selector of priceSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          features.hasPriceDisplay = true;
          break;
        }
      } catch {
        // Selector might not be valid, skip
      }
    }

    // Count structural elements
    features.tableCount = document.querySelectorAll("table").length;
    features.listCount =
      document.querySelectorAll("ul").length +
      document.querySelectorAll("ol").length +
      document.querySelectorAll("dl").length;
    features.formCount = document.querySelectorAll("form").length;

    // Calculate link density
    const body = document.querySelector("body");
    if (body) {
      features.linkDensity = calculateLinkDensity(body);
    }

    return ok(features);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract textual features from normalized text
 * 
 * @param fullText - Full normalized text
 * @param mainText - Main content text
 * @param options - Feature extraction options
 * @returns Textual features
 */
function extractTextualFeatures(
  fullText: string,
  mainText: string,
  options: FeatureExtractionOptions,
): Result<PageFeatures["textual"]> {
  try {
    const features: PageFeatures["textual"] = {
      wordCount: 0,
      digitDensity: 0,
      ecommerceKeywordCount: 0,
      productKeywordCount: 0,
      hasPrice: false,
      hasPriceLabel: false,
      hasReference: false,
      hasStock: false,
      hasShipping: false,
      hasWarranty: false,
      topTermsTfidf: [],
      language: options.language,
    };

    // Word count
    const words = mainText.split(/\s+/).filter((w) => w.length > 0);
    features.wordCount = words.length;

    // Digit density (products often have many numbers)
    const digits = mainText.match(/\d/g)?.length || 0;
    features.digitDensity = mainText.length > 0 ? digits / mainText.length : 0;

    // Count e-commerce keywords
    const lowerText = fullText.toLowerCase();
    features.ecommerceKeywordCount = ECOMMERCE_KEYWORDS.filter((keyword) =>
      lowerText.includes(keyword)
    ).length;

    // Count product keywords
    features.productKeywordCount = PRODUCT_KEYWORDS.filter((keyword) =>
      lowerText.includes(keyword)
    ).length;

    // Check for specific indicators
    features.hasPrice =
      /(\d+[.,]\d{2})\s*€/.test(fullText) ||
      /\$\s*(\d+[.,]\d{2})/.test(fullText) ||
      /prix[\s:]+\d+/gi.test(fullText) ||
      /price[\s:]+\d+/gi.test(fullText);

    features.hasPriceLabel =
      /prix[\s:]/gi.test(fullText) || /price[\s:]/gi.test(fullText);

    features.hasReference =
      /réf(?:érence)?[\s:]/gi.test(fullText) ||
      /ref(?:erence)?[\s:]/gi.test(fullText) ||
      /sku[\s:]/gi.test(fullText) ||
      /ean[\s:]/gi.test(fullText);

    features.hasStock =
      /(?:en\s+)?stock/gi.test(fullText) ||
      /disponible/gi.test(fullText) ||
      /available/gi.test(fullText);

    features.hasShipping =
      /livraison/gi.test(fullText) ||
      /shipping/gi.test(fullText) ||
      /delivery/gi.test(fullText);

    features.hasWarranty =
      /garantie/gi.test(fullText) ||
      /warranty/gi.test(fullText);

    // Extract top TF terms (if requested)
    if (options.includeTfidf !== false && words.length > 0) {
      const [tfErr, tf] = termFrequency(mainText, { asRelative: true });
      if (!tfErr) {
        // Filter stopwords and sort by frequency
        const filtered = filterStopwords(Object.keys(tf), options.language || "fr");
        const topTerms = filtered
          .map((term) => [term, tf[term]] as [string, number])
          .sort((a, b) => b[1] - a[1])
          .slice(0, options.topTermsCount || 20);

        features.topTermsTfidf = topTerms;
      }
    }

    return ok(features);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract semantic features from HTML structure
 * 
 * @param document - Parsed HTML document
 * @param contentDensity - Content density from content extractor
 * @returns Semantic features
 */
function extractSemanticFeatures(
  document: DOMDocument,
  contentDensity: number,
): Result<PageFeatures["semantic"]> {
  try {
    const features: PageFeatures["semantic"] = {
      hasSpecTable: false,
      hasFeatureList: false,
      hasProductDescription: false,
      hasProductTitle: false,
      contentStructureScore: 0,
      mainContentDensity: contentDensity,
    };

    // Check for specification table
    const tables = document.querySelectorAll("table");
    tables.forEach((table: DOMNode) => {
      const text = (table.textContent || "").toLowerCase();
      if (
        text.includes("caractéristiques") ||
        text.includes("spécifications") ||
        text.includes("specifications") ||
        text.includes("features") ||
        text.includes("détails") ||
        text.includes("details")
      ) {
        features.hasSpecTable = true;
      }
    });

    // Check for feature list
    const lists = document.querySelectorAll("ul, ol, dl");
    lists.forEach((list: DOMNode) => {
      const items = list.querySelectorAll("li, dt");
      if (items.length >= 3) {
        // At least 3 items to be considered a feature list
        features.hasFeatureList = true;
      }
    });

    // Check for product description
    const descSelectors = [
      "[class*='description']",
      "[id*='description']",
      "[itemprop='description']",
      "article",
      ".product-info",
      ".product-details",
    ];

    for (const selector of descSelectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const text = (element.textContent || "").trim();
          if (text.length > 100) {
            // Minimum 100 chars
            features.hasProductDescription = true;
            break;
          }
        }
      } catch {
        // Selector might not be valid, skip
      }
    }

    // Check for product title (h1 with product-like content)
    const h1 = document.querySelector("h1");
    if (h1) {
      const text = (h1.textContent || "").trim();
      // Product titles often have numbers, brands, model names
      if (text.length > 10 && /\d/.test(text)) {
        features.hasProductTitle = true;
      }
    }

    // Calculate content structure score
    let structureScore = 0;
    if (features.hasSpecTable) structureScore += 3;
    if (features.hasFeatureList) structureScore += 2;
    if (features.hasProductDescription) structureScore += 3;
    if (features.hasProductTitle) structureScore += 2;
    features.contentStructureScore = Math.min(structureScore, 10);

    return ok(features);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Calculate structural score (0-10)
 * 
 * @param features - Structural features
 * @returns Score (0-10)
 */
function calculateStructuralScore(
  features: PageFeatures["structural"],
): number {
  let score = 0;

  // Schema/metadata indicators (high weight)
  if (features.hasJsonLdProduct) score += 3;
  if (features.hasOpenGraphProduct) score += 2;
  if (features.hasSchemaOrgProduct) score += 2;

  // E-commerce elements
  if (features.hasAddToCartButton) score += 2;
  if (features.hasBuyButton) score += 1;
  if (features.hasPriceDisplay) score += 1.5;

  // Product-specific elements
  if (features.hasProductImages) score += 1;
  if (features.imageHighResCount >= 3) score += 0.5;
  if (features.hasRatings) score += 0.5;

  // Structural elements
  if (features.tableCount > 0) score += 0.5;
  if (features.formCount > 0) score += 0.5;

  // Link density (low is good for product pages)
  if (features.linkDensity < 0.3) score += 0.5;

  return Math.min(score, 10);
}

/**
 * Calculate textual score (0-10)
 * 
 * @param features - Textual features
 * @returns Score (0-10)
 */
function calculateTextualScore(
  features: PageFeatures["textual"],
): number {
  let score = 0;

  // Price indicators
  if (features.hasPrice) score += 2;
  if (features.hasPriceLabel) score += 1;

  // Product identifiers
  if (features.hasReference) score += 2;

  // E-commerce keywords
  if (features.ecommerceKeywordCount >= 3) score += 1.5;
  if (features.productKeywordCount >= 3) score += 1.5;

  // Product-specific info
  if (features.hasStock) score += 0.5;
  if (features.hasShipping) score += 0.5;
  if (features.hasWarranty) score += 0.5;

  // Digit density (products have specs)
  if (features.digitDensity > 0.05) score += 0.5;

  // Word count (product pages usually have descriptions)
  if (features.wordCount > 100 && features.wordCount < 3000) score += 1;

  return Math.min(score, 10);
}

/**
 * Calculate semantic score (0-10)
 * 
 * @param features - Semantic features
 * @returns Score (0-10)
 */
function calculateSemanticScore(
  features: PageFeatures["semantic"],
): number {
  let score = 0;

  // Use content structure score as base
  score += features.contentStructureScore * 0.6;

  // Content density (higher is better)
  if (features.mainContentDensity > 0.3) score += 2;
  if (features.mainContentDensity > 0.5) score += 1;

  // Specific elements
  if (features.hasProductTitle) score += 1;

  return Math.min(score, 10);
}
