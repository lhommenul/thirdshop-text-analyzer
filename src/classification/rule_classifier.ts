/**
 * Rule-Based Classifier
 * 
 * Classifies pages as product pages or non-product pages using
 * rule-based scoring with configurable thresholds and weights.
 */

import type { Result } from "../types/result.ts";
import { fail, ok } from "../types/result.ts";
import type {
  ClassificationResult,
  ClassifierRules,
  PageFeatures,
} from "./classification_types.ts";
import { extractFeatures } from "./features.ts";
import { generateDetailedScore, sigmoidConfidence } from "./scoring.ts";

/**
 * Default classifier rules
 */
export const DEFAULT_RULES: ClassifierRules = {
  threshold: 5.0,
  weights: {
    structural: 0.5,
    textual: 0.3,
    semantic: 0.2,
  },
  minConfidence: 0.0,
  requireJsonLd: false,
  requirePrice: false,
};

/**
 * Classify a page using rule-based classification
 * 
 * @param html - HTML string to classify
 * @param rules - Classifier rules (optional)
 * @returns Classification result
 * 
 * @example
 * ```ts
 * const [err, result] = classifyPage(html);
 * if (!err) {
 *   console.log("Is product page:", result.isProductPage);
 *   console.log("Confidence:", result.confidence);
 *   console.log("Reasons:", result.reasons);
 * }
 * ```
 */
export function classifyPage(
  html: string,
  rules: Partial<ClassifierRules> = {},
): Result<ClassificationResult> {
  try {
    // Merge with default rules
    const config: ClassifierRules = {
      ...DEFAULT_RULES,
      ...rules,
      weights: {
        ...DEFAULT_RULES.weights,
        ...rules.weights,
      },
    };

    // Extract features
    const [featErr, features] = extractFeatures(html);
    if (featErr) return fail(featErr);

    // Apply classification logic
    const [classErr, result] = classifyFeatures(features, config);
    if (classErr) return fail(classErr);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Classify based on extracted features
 * 
 * @param features - Page features
 * @param rules - Classifier rules
 * @returns Classification result
 */
export function classifyFeatures(
  features: PageFeatures,
  rules: ClassifierRules,
): Result<ClassificationResult> {
  try {
    // Calculate weighted score
    const score =
      features.scores.structuralScore * rules.weights.structural +
      features.scores.textualScore * rules.weights.textual +
      features.scores.semanticScore * rules.weights.semantic;

    // Base classification decision
    let isProductPage = score >= rules.threshold;

    // Apply additional rules
    if (rules.requireJsonLd && !features.structural.hasJsonLdProduct) {
      isProductPage = false;
    }

    if (rules.requirePrice && !features.textual.hasPrice) {
      isProductPage = false;
    }

    // Calculate confidence
    const baseConfidence = sigmoidConfidence(score, rules.threshold);
    
    // Boost confidence for strong indicators
    let confidence = baseConfidence;
    if (features.structural.hasJsonLdProduct) confidence = Math.min(confidence * 1.2, 1.0);
    if (features.structural.hasAddToCartButton) confidence = Math.min(confidence * 1.1, 1.0);

    // Reduce confidence for weak pages
    if (features.textual.wordCount < 50) confidence *= 0.8;
    if (features.structural.linkDensity > 0.6) confidence *= 0.9;

    // Ensure minimum confidence
    if (confidence < rules.minConfidence) {
      isProductPage = false;
    }

    // Generate detailed score and reasons
    const [scoreErr, detailedScore] = generateDetailedScore(features);
    if (scoreErr) return fail(scoreErr);

    const result: ClassificationResult = {
      isProductPage,
      score,
      confidence,
      features,
      reasons: detailedScore.reasons,
      warnings: detailedScore.warnings,
    };

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Batch classify multiple pages
 * 
 * @param pages - Array of HTML strings
 * @param rules - Classifier rules
 * @returns Array of classification results
 */
export function classifyBatch(
  pages: string[],
  rules: Partial<ClassifierRules> = {},
): Result<ClassificationResult[]> {
  try {
    const results: ClassificationResult[] = [];

    for (const html of pages) {
      const [err, result] = classifyPage(html, rules);
      if (err) {
        // Continue with other pages even if one fails
        console.warn("Classification failed for page:", err.message);
        continue;
      }
      results.push(result);
    }

    return ok(results);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Classify with custom threshold
 * 
 * @param html - HTML string
 * @param threshold - Custom threshold (0-10)
 * @returns Classification result
 */
export function classifyWithThreshold(
  html: string,
  threshold: number,
): Result<ClassificationResult> {
  return classifyPage(html, { threshold });
}

/**
 * Classify with custom weights
 * 
 * @param html - HTML string
 * @param weights - Custom weights for scoring dimensions
 * @returns Classification result
 */
export function classifyWithWeights(
  html: string,
  weights: Partial<ClassifierRules["weights"]>,
): Result<ClassificationResult> {
  return classifyPage(html, { weights });
}

/**
 * Quick classification (only structural features)
 * 
 * @param html - HTML string
 * @returns Is product page (boolean)
 */
export function quickClassify(html: string): Result<boolean> {
  try {
    const [err, features] = extractFeatures(html);
    if (err) return fail(err);

    // Quick decision based on structural features only
    const isProduct =
      features.structural.hasJsonLdProduct ||
      features.structural.hasOpenGraphProduct ||
      (features.structural.hasAddToCartButton && features.structural.hasPriceDisplay);

    return ok(isProduct);
  } catch (error) {
    return fail(error);
  }
}
