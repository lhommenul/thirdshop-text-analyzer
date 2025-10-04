/**
 * Integration tests for Sprint 2 - Classification
 * Tests classification on real dataset pages
 */

import { assertEquals, assertExists } from "@std/assert";
import { classifyPage } from "../../src/classification/rule_classifier.ts";
import { extractFeatures } from "../../src/classification/features.ts";

// Test on pieceoccasion-1.html (PRODUCT PAGE)
Deno.test("Classification - pieceoccasion-1.html (PRODUCT)", async () => {
  const html = await Deno.readTextFile("./dataset/pieceoccasion-1.html");
  const [err, result] = classifyPage(html);
  
  assertEquals(err, null);
  assertExists(result);
  
  console.log("\n=== pieceoccasion-1.html (PEUGEOT 307) ===");
  console.log("Score:", result.score.toFixed(2), "/10");
  console.log("Classification:", result.isProductPage ? "✓ PRODUIT" : "✗ NON-PRODUIT");
  console.log("Confiance:", (result.confidence * 100).toFixed(1), "%");
  console.log("\nRaisons:");
  result.reasons.forEach((reason) => console.log("  ", reason));
  if (result.warnings.length > 0) {
    console.log("\nAvertissements:");
    result.warnings.forEach((warning) => console.log("  ", warning));
  }
  
  // Should be classified as product page
  assertEquals(result.isProductPage, true, "Should be classified as product page");
  assertEquals(result.score >= 5.0, true, "Score should be >= 5.0");
  assertEquals(result.confidence >= 0.5, true, "Confidence should be >= 0.5");
});

// Test on pieceoccasion-2.html (PRODUCT PAGE)
Deno.test("Classification - pieceoccasion-2.html (PRODUCT)", async () => {
  const html = await Deno.readTextFile("./dataset/pieceoccasion-2.html");
  const [err, result] = classifyPage(html);
  
  assertEquals(err, null);
  assertExists(result);
  
  console.log("\n=== pieceoccasion-2.html ===");
  console.log("Score:", result.score.toFixed(2), "/10");
  console.log("Classification:", result.isProductPage ? "✓ PRODUIT" : "✗ NON-PRODUIT");
  console.log("Confiance:", (result.confidence * 100).toFixed(1), "%");
  
  // Should be classified as product page
  assertEquals(result.isProductPage, true, "Should be classified as product page");
});

// Test on zero-motorcycles-1.html (PRODUCT PAGE)
Deno.test("Classification - zero-motorcycles-1.html (PRODUCT)", async () => {
  const html = await Deno.readTextFile("./dataset/zero-motorcycles-1.html");
  const [err, result] = classifyPage(html);
  
  assertEquals(err, null);
  assertExists(result);
  
  console.log("\n=== zero-motorcycles-1.html ===");
  console.log("Score:", result.score.toFixed(2), "/10");
  console.log("Classification:", result.isProductPage ? "✓ PRODUIT" : "✗ NON-PRODUIT");
  console.log("Confiance:", (result.confidence * 100).toFixed(1), "%");
  
  // Should be classified as product page
  assertEquals(result.isProductPage, true, "Should be classified as product page");
});

// Test on google-1.html (NON-PRODUCT)
Deno.test("Classification - google-1.html (NON-PRODUCT)", async () => {
  const html = await Deno.readTextFile("./dataset/google-1.html");
  const [err, result] = classifyPage(html);
  
  assertEquals(err, null);
  assertExists(result);
  
  console.log("\n=== google-1.html (Google homepage) ===");
  console.log("Score:", result.score.toFixed(2), "/10");
  console.log("Classification:", result.isProductPage ? "✓ PRODUIT" : "✗ NON-PRODUIT");
  console.log("Confiance:", (result.confidence * 100).toFixed(1), "%");
  
  // Should NOT be classified as product page
  assertEquals(result.isProductPage, false, "Should NOT be classified as product page");
  assertEquals(result.score < 5.0, true, "Score should be < 5.0");
});

// Test on youtube-1.html (NON-PRODUCT)
Deno.test("Classification - youtube-1.html (NON-PRODUCT)", async () => {
  const html = await Deno.readTextFile("./dataset/youtube-1.html");
  const [err, result] = classifyPage(html);
  
  assertEquals(err, null);
  assertExists(result);
  
  console.log("\n=== youtube-1.html ===");
  console.log("Score:", result.score.toFixed(2), "/10");
  console.log("Classification:", result.isProductPage ? "✓ PRODUIT" : "✗ NON-PRODUIT");
  console.log("Confiance:", (result.confidence * 100).toFixed(1), "%");
  
  // Should NOT be classified as product page
  assertEquals(result.isProductPage, false, "Should NOT be classified as product page");
});

// Test on vehiculeselectriques-forum-1.html (NON-PRODUCT - forum page)
Deno.test("Classification - vehiculeselectriques-forum-1.html (NON-PRODUCT)", async () => {
  const html = await Deno.readTextFile("./dataset/vehiculeselectriques-forum-1.html");
  const [err, result] = classifyPage(html);
  
  assertEquals(err, null);
  assertExists(result);
  
  console.log("\n=== vehiculeselectriques-forum-1.html (Forum) ===");
  console.log("Score:", result.score.toFixed(2), "/10");
  console.log("Classification:", result.isProductPage ? "✓ PRODUIT" : "✗ NON-PRODUIT");
  console.log("Confiance:", (result.confidence * 100).toFixed(1), "%");
  
  // Should NOT be classified as product page
  assertEquals(result.isProductPage, false, "Should NOT be classified as product page (forum)");
});

// Feature extraction test
Deno.test("Feature Extraction - pieceoccasion-1.html", async () => {
  const html = await Deno.readTextFile("./dataset/pieceoccasion-1.html");
  const [err, features] = extractFeatures(html);
  
  assertEquals(err, null);
  assertExists(features);
  
  console.log("\n=== Features Extracted ===");
  console.log("Structural score:", features.scores.structuralScore.toFixed(2));
  console.log("Textual score:", features.scores.textualScore.toFixed(2));
  console.log("Semantic score:", features.scores.semanticScore.toFixed(2));
  console.log("Overall score:", features.scores.overallScore.toFixed(2));
  
  console.log("\nStructural features:");
  console.log("  - JSON-LD Product:", features.structural.hasJsonLdProduct);
  console.log("  - Open Graph Product:", features.structural.hasOpenGraphProduct);
  console.log("  - Price display:", features.structural.hasPriceDisplay);
  console.log("  - Images (high-res):", features.structural.imageHighResCount);
  
  console.log("\nTextual features:");
  console.log("  - Word count:", features.textual.wordCount);
  console.log("  - Has price:", features.textual.hasPrice);
  console.log("  - Has reference:", features.textual.hasReference);
  console.log("  - E-commerce keywords:", features.textual.ecommerceKeywordCount);
  console.log("  - Product keywords:", features.textual.productKeywordCount);
  
  console.log("\nSemantic features:");
  console.log("  - Spec table:", features.semantic.hasSpecTable);
  console.log("  - Feature list:", features.semantic.hasFeatureList);
  console.log("  - Product description:", features.semantic.hasProductDescription);
  console.log("  - Content structure score:", features.semantic.contentStructureScore);
  
  // Validate some features
  assertEquals(features.textual.wordCount > 0, true, "Should have word count");
  assertEquals(features.scores.overallScore >= 0, true, "Score should be >= 0");
  assertEquals(features.scores.overallScore <= 10, true, "Score should be <= 10");
});

// Performance test
Deno.test("Performance - Classification speed", async () => {
  const html = await Deno.readTextFile("./dataset/pieceoccasion-1.html");
  
  const startTime = performance.now();
  const [err, result] = classifyPage(html);
  const endTime = performance.now();
  
  const duration = endTime - startTime;
  
  assertEquals(err, null);
  assertExists(result);
  
  console.log("\n=== Performance ===");
  console.log("Classification time:", duration.toFixed(2), "ms");
  console.log("Target: < 100ms per page");
  
  // Should be fast (< 100ms)
  assertEquals(duration < 100, true, "Classification should be fast (< 100ms)");
});
