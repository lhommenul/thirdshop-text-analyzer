/**
 * Scoring System
 * 
 * Detailed scoring with explanations for classification decisions.
 */

import type { Result } from "../types/result.ts";
import { ok } from "../types/result.ts";
import type { DetailedScore, PageFeatures, ScoringReport } from "./classification_types.ts";

/**
 * Generate detailed score with explanations
 * 
 * @param features - Page features
 * @returns Detailed score with breakdown
 * 
 * @example
 * ```ts
 * const [err, score] = generateDetailedScore(features);
 * if (!err) {
 *   console.log("Score:", score.score);
 *   console.log("Reasons:", score.reasons);
 * }
 * ```
 */
export function generateDetailedScore(
  features: PageFeatures,
): Result<DetailedScore> {
  const reasons: string[] = [];
  const warnings: string[] = [];

  // Structural indicators
  if (features.structural.hasJsonLdProduct) {
    reasons.push("✓ JSON-LD Product détecté (+3 points)");
  }
  if (features.structural.hasOpenGraphProduct) {
    reasons.push("✓ Open Graph Product détecté (+2 points)");
  }
  if (features.structural.hasSchemaOrgProduct) {
    reasons.push("✓ Schema.org Product détecté (+2 points)");
  }

  if (features.structural.hasAddToCartButton) {
    reasons.push("✓ Bouton 'Ajouter au panier' présent (+2 points)");
  } else {
    warnings.push("⚠ Pas de bouton 'Ajouter au panier'");
  }

  if (features.structural.hasPriceDisplay) {
    reasons.push("✓ Affichage prix détecté (+1.5 points)");
  }

  if (features.structural.hasProductImages) {
    reasons.push(
      `✓ Images produit présentes (${features.structural.imageHighResCount} haute résolution) (+1 point)`
    );
  } else {
    warnings.push("⚠ Pas d'images produit haute résolution");
  }

  if (features.structural.hasRatings) {
    reasons.push("✓ Système de notation/avis détecté (+0.5 points)");
  }

  // Textual indicators
  if (features.textual.hasPrice) {
    reasons.push("✓ Prix trouvé dans le texte (+2 points)");
  } else {
    warnings.push("⚠ Pas de prix détecté dans le texte");
  }

  if (features.textual.hasReference) {
    reasons.push("✓ Référence produit trouvée (+2 points)");
  } else {
    warnings.push("⚠ Pas de référence produit");
  }

  if (features.textual.ecommerceKeywordCount >= 3) {
    reasons.push(
      `✓ Mots-clés e-commerce présents (${features.textual.ecommerceKeywordCount} mots) (+1.5 points)`
    );
  }

  if (features.textual.productKeywordCount >= 3) {
    reasons.push(
      `✓ Mots-clés produit présents (${features.textual.productKeywordCount} mots) (+1.5 points)`
    );
  }

  if (features.textual.hasStock) {
    reasons.push("✓ Information stock/disponibilité (+0.5 points)");
  }

  if (features.textual.hasShipping) {
    reasons.push("✓ Information livraison (+0.5 points)");
  }

  if (features.textual.hasWarranty) {
    reasons.push("✓ Information garantie (+0.5 points)");
  }

  // Semantic indicators
  if (features.semantic.hasSpecTable) {
    reasons.push("✓ Tableau de spécifications présent (+3 points)");
  }

  if (features.semantic.hasFeatureList) {
    reasons.push("✓ Liste de caractéristiques présente (+2 points)");
  }

  if (features.semantic.hasProductDescription) {
    reasons.push("✓ Description produit détaillée (+3 points)");
  }

  if (features.semantic.hasProductTitle) {
    reasons.push("✓ Titre produit détecté (+2 points)");
  }

  // Link density warning
  if (features.structural.linkDensity > 0.5) {
    warnings.push(
      `⚠ Densité de liens élevée (${(features.structural.linkDensity * 100).toFixed(1)}%)`
    );
  }

  // Word count warning
  if (features.textual.wordCount < 50) {
    warnings.push(
      `⚠ Contenu textuel faible (${features.textual.wordCount} mots)`
    );
  }

  const detailedScore: DetailedScore = {
    score: features.scores.overallScore,
    structuralScore: features.scores.structuralScore,
    textualScore: features.scores.textualScore,
    semanticScore: features.scores.semanticScore,
    reasons,
    warnings,
    confidence: calculateConfidence(features),
  };

  return ok(detailedScore);
}

/**
 * Calculate confidence level based on features
 * 
 * @param features - Page features
 * @returns Confidence (0-1)
 */
export function calculateConfidence(features: PageFeatures): number {
  let confidence = 0.5; // Base confidence

  // High confidence indicators
  if (features.structural.hasJsonLdProduct) confidence += 0.2;
  if (features.structural.hasOpenGraphProduct) confidence += 0.1;
  if (features.structural.hasAddToCartButton) confidence += 0.1;
  if (features.textual.hasPrice && features.textual.hasReference) confidence += 0.1;

  // Reduce confidence for ambiguous pages
  if (features.structural.linkDensity > 0.5) confidence -= 0.1;
  if (features.textual.wordCount < 50) confidence -= 0.1;

  return Math.max(0, Math.min(confidence, 1));
}

/**
 * Generate a complete scoring report
 * 
 * @param features - Page features
 * @returns Scoring report with detailed breakdown
 */
export function generateScoringReport(
  features: PageFeatures,
): Result<ScoringReport> {
  const [err, detailedScore] = generateDetailedScore(features);
  if (err) return [err, null];

  const report: ScoringReport = {
    overallScore: features.scores.overallScore,
    isProductPage: features.scores.overallScore >= 5.0,
    confidence: detailedScore.confidence,
    breakdown: {
      structural: {
        score: features.scores.structuralScore,
        weight: 0.5,
        contribution: features.scores.structuralScore * 0.5,
        features: features.structural,
      },
      textual: {
        score: features.scores.textualScore,
        weight: 0.3,
        contribution: features.scores.textualScore * 0.3,
        features: features.textual,
      },
      semantic: {
        score: features.scores.semanticScore,
        weight: 0.2,
        contribution: features.scores.semanticScore * 0.2,
        features: features.semantic,
      },
    },
    reasons: detailedScore.reasons,
    warnings: detailedScore.warnings,
  };

  return ok(report);
}

/**
 * Calculate distance to threshold for confidence adjustment
 * 
 * @param score - Classification score
 * @param threshold - Classification threshold (default: 5.0)
 * @returns Distance to threshold (normalized 0-1)
 */
export function distanceToThreshold(
  score: number,
  threshold = 5.0,
): number {
  const distance = Math.abs(score - threshold);
  // Normalize: at distance 5.0, confidence adjustment is at maximum
  return Math.min(distance / 5.0, 1.0);
}

/**
 * Sigmoid function for confidence calculation
 * 
 * @param x - Input value
 * @returns Sigmoid output (0-1)
 */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Calculate confidence using sigmoid function based on distance to threshold
 * 
 * @param score - Classification score
 * @param threshold - Classification threshold (default: 5.0)
 * @returns Confidence (0-1)
 */
export function sigmoidConfidence(
  score: number,
  threshold = 5.0,
): number {
  const distance = score - threshold;
  // Scale distance for sigmoid (distance of 2.0 = confidence ~0.88)
  return sigmoid(distance / 2.0);
}
