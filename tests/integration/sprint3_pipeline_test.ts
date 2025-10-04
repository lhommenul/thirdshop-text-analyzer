/**
 * Sprint 3 Integration Tests - Full Pipeline
 * 
 * Tests the complete analysis pipeline on dataset files.
 */

import { assert, assertEquals } from "@std/assert";
import {
  analyzePage,
  analyzeDirectory,
} from "../../src/pipeline/analyzer.ts";
import {
  formatAsJson,
  formatAsCsv,
  formatAsMarkdown,
  formatAsText,
  generateComparisonReport,
} from "../../src/pipeline/formatters.ts";

const DATASET_DIR = "dataset";

Deno.test("Sprint 3 - Pipeline: analyze pieceoccasion-1.html", async () => {
  const html = await Deno.readTextFile(`${DATASET_DIR}/pieceoccasion-1.html`);
  const [err, result] = analyzePage(html);

  assert(!err, `Should not error: ${err?.message}`);
  assert(result, "Should return result");

  // Check classification
  assertEquals(result.classification.isProductPage, true, "Should classify as product");
  assert(result.classification.score > 5, "Score should be > 5 for product");
  assert(result.classification.confidence > 0.5, "Confidence should be > 0.5");

  // Check product data was extracted
  assert(result.productData, "Should extract product data");
  assert(result.productData.price, "Should extract price");
  assert(result.productData.reference || result.productData.sku, "Should extract reference/SKU");

  // Check steps completed
  assert(result.stepsCompleted.includes("parsing"), "Should complete parsing");
  assert(result.stepsCompleted.includes("features"), "Should complete features");
  assert(result.stepsCompleted.includes("classification"), "Should complete classification");
  assert(result.stepsCompleted.includes("extraction"), "Should complete extraction");

  // Check processing time
  assert(result.processingTime > 0, "Should have processing time");
  assert(result.processingTime < 250, "Should be reasonably fast (< 250ms)");

  console.log(`✓ pieceoccasion-1: ${result.classification.isProductPage ? "PRODUIT" : "NON-PRODUIT"} (score: ${result.classification.score.toFixed(2)}, ${result.processingTime.toFixed(0)}ms)`);
});

Deno.test("Sprint 3 - Pipeline: analyze google-1.html (non-product)", async () => {
  const html = await Deno.readTextFile(`${DATASET_DIR}/google-1.html`);
  const [err, result] = analyzePage(html);

  assert(!err, `Should not error: ${err?.message}`);

  // Check classification
  assertEquals(result.classification.isProductPage, false, "Should classify as non-product");
  assert(result.classification.score < 5, "Score should be < 5 for non-product");

  // Product data should be undefined or empty
  assert(
    !result.productData || !result.productData.price,
    "Should not extract product data for non-product page",
  );

  console.log(`✓ google-1: NON-PRODUIT (score: ${result.classification.score.toFixed(2)}, ${result.processingTime.toFixed(0)}ms)`);
});

Deno.test("Sprint 3 - Pipeline: analyze with includeFeatures option", async () => {
  const html = await Deno.readTextFile(`${DATASET_DIR}/pieceoccasion-1.html`);
  const [err, result] = analyzePage(html, {
    includeFeatures: true,
  });

  assert(!err, `Should not error: ${err?.message}`);

  // Features should be included
  assert(result.classification.features, "Should include features");
  assert(result.classification.features.structural, "Should have structural features");
  assert(result.classification.features.textual, "Should have textual features");
  assert(result.classification.features.semantic, "Should have semantic features");

  console.log(`✓ Features included: ${Object.keys(result.classification.features).length} categories`);
});

Deno.test("Sprint 3 - Pipeline: analyze with includeEvidence option", async () => {
  const html = await Deno.readTextFile(`${DATASET_DIR}/pieceoccasion-1.html`);
  const [err, result] = analyzePage(html, {
    includeEvidence: true,
  });

  assert(!err, `Should not error: ${err?.message}`);

  // Evidence should be included
  assert(result.evidence, "Should include evidence");
  assert(Array.isArray(result.evidence), "Evidence should be array");
  assert(result.evidence.length > 0, "Should have at least one evidence");

  // Check evidence structure
  const firstEvidence = result.evidence[0];
  assert(firstEvidence.field, "Evidence should have field");
  assert(firstEvidence.source, "Evidence should have source");
  assert(firstEvidence.confidence !== undefined, "Evidence should have confidence");

  console.log(`✓ Evidence included: ${result.evidence.length} evidence items`);
});

Deno.test("Sprint 3 - Pipeline: analyze directory (batch processing)", async () => {
  const [err, results] = await analyzeDirectory(DATASET_DIR);

  assert(!err, `Should not error: ${err?.message}`);
  assert(results.size >= 6, `Should analyze at least 6 files (got ${results.size})`);

  // Check each result
  let productCount = 0;
  let nonProductCount = 0;
  const times: number[] = [];

  for (const [filename, result] of results.entries()) {
    assert(result, `Result should exist for ${filename}`);
    assert(result.classification, "Should have classification");
    assert(result.stepsCompleted.length > 0, "Should have completed steps");
    
    if (result.classification.isProductPage) {
      productCount++;
    } else {
      nonProductCount++;
    }

    times.push(result.processingTime);

    console.log(
      `  ${filename}: ${result.classification.isProductPage ? "PRODUIT" : "NON-PROD"} (score: ${result.classification.score.toFixed(2)}, ${result.processingTime.toFixed(0)}ms)`,
    );
  }

  console.log(`✓ Batch analysis: ${results.size} files, ${productCount} products, ${nonProductCount} non-products`);

  // Check performance
  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / times.length;
  console.log(`  Average time: ${avgTime.toFixed(1)}ms per page`);
  console.log(`  Total time: ${totalTime.toFixed(0)}ms`);

  // Should be reasonably fast (< 100ms average per page)
  assert(avgTime < 100, `Average time should be < 100ms (got ${avgTime.toFixed(1)}ms)`);
});

Deno.test("Sprint 3 - Formatters: JSON format", async () => {
  const html = await Deno.readTextFile(`${DATASET_DIR}/pieceoccasion-1.html`);
  const [err, result] = analyzePage(html);

  assert(!err);

  // Test JSON formatting
  const json = formatAsJson(result, true);
  assert(json.length > 0, "JSON should not be empty");
  
  // Should be valid JSON
  const parsed = JSON.parse(json);
  assert(parsed, "Should parse back to object");
  assertEquals(parsed.classification.isProductPage, result.classification.isProductPage);

  console.log(`✓ JSON format: ${json.length} bytes`);
});

Deno.test("Sprint 3 - Formatters: CSV format", async () => {
  const [err, results] = await analyzeDirectory(DATASET_DIR);
  assert(!err);

  // Test CSV formatting
  const csv = formatAsCsv(results);
  assert(csv.length > 0, "CSV should not be empty");
  
  const lines = csv.split("\n");
  assert(lines.length > 1, "CSV should have header + data rows");
  
  // Check header
  const header = lines[0];
  assert(header.includes("id"), "CSV should have id column");
  assert(header.includes("is_product"), "CSV should have is_product column");
  assert(header.includes("score"), "CSV should have score column");
  assert(header.includes("price"), "CSV should have price column");

  console.log(`✓ CSV format: ${lines.length} rows (including header)`);
});

Deno.test("Sprint 3 - Formatters: Markdown format", async () => {
  const html = await Deno.readTextFile(`${DATASET_DIR}/pieceoccasion-1.html`);
  const [err, result] = analyzePage(html);

  assert(!err);

  // Test Markdown formatting
  const markdown = formatAsMarkdown(result, "Test Report");
  assert(markdown.length > 0, "Markdown should not be empty");
  assert(markdown.includes("# Test Report"), "Should include title");
  assert(markdown.includes("## Classification"), "Should include classification section");
  assert(markdown.includes("## Données Produit"), "Should include product data section");

  console.log(`✓ Markdown format: ${markdown.split("\n").length} lines`);
});

Deno.test("Sprint 3 - Formatters: Text format", async () => {
  const html = await Deno.readTextFile(`${DATASET_DIR}/pieceoccasion-1.html`);
  const [err, result] = analyzePage(html);

  assert(!err);

  // Test Text formatting
  const text = formatAsText(result);
  assert(text.length > 0, "Text should not be empty");
  assert(text.includes("ANALYSE PAGE"), "Should include header");
  assert(text.includes("Classification:"), "Should include classification");

  console.log(`✓ Text format: ${text.length} bytes`);
});

Deno.test("Sprint 3 - Formatters: Comparison report", async () => {
  const [err, results] = await analyzeDirectory(DATASET_DIR);
  assert(!err);

  // Test comparison report
  const report = generateComparisonReport(results);
  assert(report.length > 0, "Report should not be empty");
  assert(report.includes("RAPPORT COMPARATIF"), "Should include title");
  assert(report.includes("Total pages:"), "Should include total pages");
  assert(report.includes("Pages produit:"), "Should include product count");

  console.log(`✓ Comparison report: ${report.split("\n").length} lines`);
});

Deno.test("Sprint 3 - Performance: batch processing speed", async () => {
  const startTime = performance.now();
  const [err, results] = await analyzeDirectory(DATASET_DIR);
  const totalTime = performance.now() - startTime;

  assert(!err);

  const pageCount = results.size;
  const avgTime = totalTime / pageCount;
  const throughput = (pageCount / totalTime) * 1000; // pages per second

  console.log(`\n=== PERFORMANCE ===`);
  console.log(`  Pages: ${pageCount}`);
  console.log(`  Total time: ${totalTime.toFixed(0)}ms`);
  console.log(`  Average: ${avgTime.toFixed(1)}ms per page`);
  console.log(`  Throughput: ${throughput.toFixed(1)} pages/s`);

  // Performance targets (from PLAN_FINAL.md)
  // - Batch 6 pages should be < 5s (we have small dataset)
  // - Throughput should be reasonably fast
  assert(totalTime < 5000, `Batch processing should be < 5s (got ${totalTime}ms)`);
  assert(avgTime < 1000, `Average time should be < 1s per page (got ${avgTime}ms)`);
});
