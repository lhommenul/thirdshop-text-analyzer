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
  structuralWeight: 0.5,
  textualWeight: 0.3,
  semanticWeight: 0.2,
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
      features.scores.structuralScore * rules.structuralWeight +
      features.scores.textualScore * rules.textualWeight +
      features.scores.semanticScore * rules.semanticWeight;

    // Base classification decision
    const isProductPage = score >= rules.threshold;

    // Calculate confidence based on distance to threshold
    const confidence = sigmoidConfidence(score, rules.threshold);

    // Generate reasons
    const reasons = generateReasons(features, score, isProductPage);

    const result: ClassificationResult = {
      isProductPage,
      score,
      confidence,
      features,
      reasons,
    };

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Generate human-readable reasons for classification
 */
function generateReasons(
  features: PageFeatures,
  score: number,
  isProductPage: boolean,
): string[] {
  const reasons: string[] = [];

  // Structural features
  if (features.structural.hasJsonLdProduct) {
    reasons.push("✓ JSON-LD Product détecté");
  }
  if (features.structural.hasOpenGraphProduct) {
    reasons.push("✓ Open Graph Product détecté");
  }
  if (features.structural.hasSchemaOrgProduct) {
    reasons.push("✓ Schema.org Product détecté");
  }
  if (features.structural.hasAddToCartButton) {
    reasons.push("✓ Bouton 'Ajouter au panier' trouvé");
  }
  if (features.structural.hasPriceDisplay) {
    reasons.push("✓ Affichage prix détecté");
  }
  if (features.structural.hasRatings) {
    reasons.push("✓ Notes/avis présents");
  }
  if (features.structural.imageHighResCount > 0) {
    reasons.push(`✓ Images haute résolution: ${features.structural.imageHighResCount}`);
  }

  // Textual features
  if (features.textual.hasPrice) {
    reasons.push("✓ Prix trouvé dans le texte");
  }
  if (features.textual.hasReference) {
    reasons.push("✓ Référence produit trouvée");
  }
  if (features.textual.hasStock) {
    reasons.push("✓ Information stock présente");
  }

  // Semantic features
  if (features.semantic.hasSpecTable) {
    reasons.push("✓ Tableau de spécifications présent");
  }
  if (features.semantic.hasProductDescription) {
    reasons.push("✓ Description produit présente");
  }

  // Warnings
  if (!features.structural.hasJsonLdProduct && !features.structural.hasOpenGraphProduct) {
    reasons.push("⚠ Pas de métadonnées structurées");
  }
  if (!features.structural.hasAddToCartButton && !features.structural.hasBuyButton) {
    reasons.push("⚠ Pas de bouton d'achat");
  }
  if (features.structural.linkDensity > 0.5) {
    reasons.push("⚠ Densité de liens élevée");
  }

  // Add overall assessment
  reasons.push(`Score: ${score.toFixed(2)}/10`);

  return reasons;
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
 * @param structuralWeight - Weight for structural features
 * @param textualWeight - Weight for textual features
 * @param semanticWeight - Weight for semantic features
 * @returns Classification result
 */
export function classifyWithWeights(
  html: string,
  structuralWeight: number,
  textualWeight: number,
  semanticWeight: number,
): Result<ClassificationResult> {
  return classifyPage(html, { structuralWeight, textualWeight, semanticWeight });
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
