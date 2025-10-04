/**
 * Output Formatters
 * 
 * Format analysis results to various output formats (JSON, CSV, Markdown, text).
 */

import type { AnalysisResult } from "./analyzer_types.ts";

/**
 * Format result as JSON
 * 
 * @param result - Analysis result
 * @param pretty - Pretty print (default: true)
 * @returns JSON string
 */
export function formatAsJson(
  result: AnalysisResult,
  pretty = true,
): string {
  return JSON.stringify(result, null, pretty ? 2 : 0);
}

/**
 * Format multiple results as CSV
 * 
 * @param results - Map of results by ID
 * @returns CSV string
 */
export function formatAsCsv(
  results: Map<string, AnalysisResult>,
): string {
  const lines: string[] = [];
  
  // Header
  lines.push(
    [
      "id",
      "is_product",
      "score",
      "confidence",
      "product_name",
      "price",
      "currency",
      "reference",
      "brand",
      "availability",
      "processing_time_ms",
      "steps_completed",
    ].join(","),
  );

  // Data rows
  for (const [id, result] of results.entries()) {
    const row = [
      escapeCsv(id),
      result.classification.isProductPage ? "true" : "false",
      result.classification.score.toFixed(2),
      result.classification.confidence.toFixed(2),
      escapeCsv(result.productData?.name || ""),
      result.productData?.price?.amount || "",
      escapeCsv(result.productData?.price?.currency || ""),
      escapeCsv(result.productData?.reference || ""),
      escapeCsv(result.productData?.brand || ""),
      escapeCsv(result.productData?.availability || ""),
      result.processingTime.toFixed(2),
      result.stepsCompleted.length,
    ];
    lines.push(row.join(","));
  }

  return lines.join("\n");
}

/**
 * Format result as Markdown
 * 
 * @param result - Analysis result
 * @param title - Report title
 * @returns Markdown string
 */
export function formatAsMarkdown(
  result: AnalysisResult,
  title = "Analysis Report",
): string {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");

  // Classification section
  lines.push("## Classification");
  lines.push("");
  lines.push(
    `- **Type:** ${result.classification.isProductPage ? "✓ Page Produit" : "✗ Non-Produit"}`,
  );
  lines.push(`- **Confiance:** ${(result.classification.confidence * 100).toFixed(1)}%`);
  lines.push(`- **Score:** ${result.classification.score.toFixed(2)}/10`);
  lines.push("");

  if (result.classification.reasons.length > 0) {
    lines.push("### Raisons");
    lines.push("");
    for (const reason of result.classification.reasons) {
      lines.push(`- ${reason}`);
    }
    lines.push("");
  }

  // Product data section
  if (result.productData) {
    lines.push("## Données Produit");
    lines.push("");
    
    if (result.productData.name) {
      lines.push(`- **Nom:** ${result.productData.name}`);
    }
    if (result.productData.price) {
      const priceValue = result.productData.price.amount / 100;
      lines.push(
        `- **Prix:** ${priceValue.toFixed(2)} ${result.productData.price.currency}`,
      );
    }
    if (result.productData.reference) {
      lines.push(`- **Référence:** ${result.productData.reference}`);
    }
    if (result.productData.brand) {
      lines.push(`- **Marque:** ${result.productData.brand}`);
    }
    if (result.productData.availability) {
      lines.push(`- **Disponibilité:** ${result.productData.availability}`);
    }
    if (result.productData.weight) {
      lines.push(
        `- **Poids:** ${result.productData.weight.value} ${result.productData.weight.unit}`,
      );
    }
    if (result.productData.dimensions) {
      const d = result.productData.dimensions;
      if (d.length && d.width && d.height) {
        lines.push(
          `- **Dimensions:** ${d.length} × ${d.width} × ${d.height} ${d.unit}`,
        );
      }
    }
    lines.push("");
  }

  // Text analysis section
  if (result.textAnalysis.topTerms.length > 0) {
    lines.push("## Analyse Textuelle");
    lines.push("");
    lines.push(`- **Nombre de mots:** ${result.textAnalysis.wordCount}`);
    lines.push("");
    lines.push("### Top termes (TF)");
    lines.push("");
    for (const [term, freq] of result.textAnalysis.topTerms.slice(0, 10)) {
      lines.push(`- ${term}: ${(freq * 100).toFixed(1)}%`);
    }
    lines.push("");
  }

  // Statistics section
  lines.push("## Statistiques");
  lines.push("");
  lines.push(
    `- **Temps de traitement:** ${result.processingTime.toFixed(2)} ms`,
  );
  lines.push(
    `- **Étapes complétées:** ${result.stepsCompleted.join(", ")} (${result.stepsCompleted.length})`,
  );
  if (result.errors && result.errors.length > 0) {
    lines.push(`- **Erreurs:** ${result.errors.length}`);
  }

  return lines.join("\n");
}

/**
 * Format result as plain text
 * 
 * @param result - Analysis result
 * @returns Text string
 */
export function formatAsText(
  result: AnalysisResult,
): string {
  const lines: string[] = [];

  lines.push("=== ANALYSE PAGE ===");
  lines.push("");
  lines.push("Classification:");
  lines.push(
    `  Type: ${result.classification.isProductPage ? "PRODUIT" : "NON-PRODUIT"}`,
  );
  lines.push(
    `  Score: ${result.classification.score.toFixed(2)}/10`,
  );
  lines.push(
    `  Confiance: ${(result.classification.confidence * 100).toFixed(1)}%`,
  );
  lines.push("");

  if (result.productData) {
    lines.push("Données Produit:");
    if (result.productData.name) {
      lines.push(`  Nom: ${result.productData.name}`);
    }
    if (result.productData.price) {
      const priceValue = result.productData.price.amount / 100;
      lines.push(
        `  Prix: ${priceValue.toFixed(2)} ${result.productData.price.currency}`,
      );
    }
    if (result.productData.reference) {
      lines.push(`  Référence: ${result.productData.reference}`);
    }
    lines.push("");
  }

  lines.push("Statistiques:");
  lines.push(
    `  Temps de traitement: ${result.processingTime.toFixed(2)} ms`,
  );
  lines.push(`  Étapes: ${result.stepsCompleted.length}`);

  return lines.join("\n");
}

/**
 * Generate comparison report for multiple results
 * 
 * @param results - Map of results by ID
 * @returns Comparison report as text
 */
export function generateComparisonReport(
  results: Map<string, AnalysisResult>,
): string {
  const lines: string[] = [];

  lines.push("=== RAPPORT COMPARATIF ===");
  lines.push("");

  let productCount = 0;
  let nonProductCount = 0;
  let totalTime = 0;
  const avgScores: number[] = [];

  for (const [id, result] of results.entries()) {
    if (result.classification.isProductPage) {
      productCount++;
    } else {
      nonProductCount++;
    }
    totalTime += result.processingTime;
    avgScores.push(result.classification.score);
  }

  const avgScore =
    avgScores.length > 0
      ? avgScores.reduce((a, b) => a + b) / avgScores.length
      : 0;
  const avgTime = totalTime / results.size;

  lines.push(`Total pages: ${results.size}`);
  lines.push(`Pages produit: ${productCount}`);
  lines.push(`Pages non-produit: ${nonProductCount}`);
  lines.push(`Score moyen: ${avgScore.toFixed(2)}/10`);
  lines.push(`Temps moyen: ${avgTime.toFixed(2)} ms`);
  lines.push(`Temps total: ${totalTime.toFixed(2)} ms`);
  lines.push("");

  lines.push("Détail par page:");
  for (const [id, result] of results.entries()) {
    const type = result.classification.isProductPage ? "PRODUIT" : "NON-PROD";
    const score = result.classification.score.toFixed(2);
    const time = result.processingTime.toFixed(0);
    lines.push(`  ${id}: ${type} (score: ${score}, ${time}ms)`);
  }

  return lines.join("\n");
}

/**
 * Escape string for CSV
 * 
 * @param value - Value to escape
 * @returns Escaped value
 */
function escapeCsv(value: string): string {
  if (!value) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
