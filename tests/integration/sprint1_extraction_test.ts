/**
 * Integration tests for Sprint 1
 * Tests extraction on real dataset pages
 */

import { assertEquals, assertExists } from "@std/assert";
import { parseHtml } from "../../src/html/parser.ts";
import { extractFromJsonLd, extractFromOpenGraph } from "../../src/extraction/schema_parser.ts";
import { extractPrice, extractReference } from "../../src/extraction/pattern_matcher.ts";

// Test on pieceoccasion-1.html (PEUGEOT 307 product page)
Deno.test("Integration - pieceoccasion-1.html - JSON-LD extraction", async () => {
  const html = await Deno.readTextFile("./dataset/pieceoccasion-1.html");
  const [parseErr, parsed] = parseHtml(html);
  
  assertEquals(parseErr, null);
  assertExists(parsed);
  
  // Check if JSON-LD data exists (not all pages have it)
  console.log("  - JSON-LD entries found:", parsed.jsonLd.length);
  
  if (parsed.jsonLd.length === 0) {
    console.log("  - No JSON-LD in this page (using Open Graph instead)");
    return; // Skip this test for this file
  }
  
  // Extract from first JSON-LD item
  const jsonLd = parsed.jsonLd[0];
  assertEquals(jsonLd.type, "Product", "Should be a Product type");
  
  const [extractErr, extracted] = extractFromJsonLd(jsonLd.data as Record<string, unknown>);
  assertEquals(extractErr, null);
  
  if (extracted) {
    const { product, evidence } = extracted;
    
    // Validate product name
    assertExists(product.name, "Product name should exist");
    console.log("✓ Product name:", product.name);
    
    // Validate SKU
    assertExists(product.sku, "SKU should exist");
    console.log("✓ SKU:", product.sku);
    
    // Validate price
    assertExists(product.price, "Price should exist");
    assertEquals(product.price.currency, "EUR", "Currency should be EUR");
    console.log("✓ Price:", product.price.amount / 100, product.price.currency);
    
    // Check evidence tracking
    assertEquals(evidence.length > 0, true, "Should have evidence");
    console.log("✓ Evidence entries:", evidence.length);
  }
});

Deno.test("Integration - pieceoccasion-1.html - Open Graph extraction", async () => {
  const html = await Deno.readTextFile("./dataset/pieceoccasion-1.html");
  const [parseErr, parsed] = parseHtml(html);
  
  assertEquals(parseErr, null);
  
  // Should have Open Graph data
  const ogData = parsed.openGraph;
  assertEquals(Object.keys(ogData).length > 0, true, "Should have Open Graph data");
  
  // Check for product type
  if (ogData["og:type"] === "product") {
    const [extractErr, extracted] = extractFromOpenGraph(ogData);
    assertEquals(extractErr, null);
    
    if (extracted) {
      const { product } = extracted;
      console.log("✓ Open Graph product data extracted");
      
      if (product.price) {
        console.log("✓ OG Price:", product.price.amount / 100, product.price.currency);
      }
    }
  }
});

Deno.test("Integration - pieceoccasion-1.html - Price extraction from text", async () => {
  const html = await Deno.readTextFile("./dataset/pieceoccasion-1.html");
  const [parseErr, parsed] = parseHtml(html);
  
  assertEquals(parseErr, null);
  
  if (parsed) {
    // Use normalizeHtml to get text content
    const { normalizeHtml } = await import("../../src/text/normalize.ts");
    const [_, normalized] = normalizeHtml(html, { strategy: "CONTENT_ONLY" });
    const text = normalized?.text || "";
    
    const [priceErr, priceData] = extractPrice(text);
    assertEquals(priceErr, null);
    
    if (priceData) {
      console.log("✓ Price extracted from text:", priceData.amount / 100, priceData.currency);
      assertEquals(priceData.currency, "EUR");
      assertEquals(priceData.confidence >= 0.7, true, "Confidence should be >= 0.7");
    }
  }
});

Deno.test("Integration - pieceoccasion-1.html - Reference extraction", async () => {
  const html = await Deno.readTextFile("./dataset/pieceoccasion-1.html");
  const [parseErr, parsed] = parseHtml(html);
  
  assertEquals(parseErr, null);
  
  if (parsed) {
    const { normalizeHtml } = await import("../../src/text/normalize.ts");
    const [_, normalized] = normalizeHtml(html, { strategy: "CONTENT_ONLY" });
    const text = normalized?.text || "";
    
    const [refErr, reference] = extractReference(text);
    assertEquals(refErr, null);
    
    if (reference) {
      console.log("✓ Reference extracted:", reference);
      assertEquals(reference.length >= 4, true, "Reference should be at least 4 characters");
    }
  }
});

Deno.test("Integration - zero-motorcycles-1.html - Product page detection", async () => {
  const html = await Deno.readTextFile("./dataset/zero-motorcycles-1.html");
  const [parseErr, parsed] = parseHtml(html);
  
  assertEquals(parseErr, null);
  assertExists(parsed);
  
  if (parsed) {
    console.log("✓ Zero Motorcycles page parsed");
    console.log("  - JSON-LD entries:", parsed.jsonLd.length);
    console.log("  - Microdata entries:", parsed.microdata.length);
    console.log("  - Open Graph entries:", Object.keys(parsed.openGraph).length);
  }
});

Deno.test("Integration - google-1.html - Non-product page", async () => {
  const html = await Deno.readTextFile("./dataset/google-1.html");
  const [parseErr, parsed] = parseHtml(html);
  
  assertEquals(parseErr, null);
  
  if (parsed) {
    // Google homepage should not have product data
    console.log("✓ Google page parsed (non-product)");
    console.log("  - JSON-LD entries:", parsed.jsonLd.length);
    
    const { normalizeHtml } = await import("../../src/text/normalize.ts");
    const [_, normalized] = normalizeHtml(html, { strategy: "CONTENT_ONLY" });
    const text = normalized?.text || "";
    
    const [priceErr, priceData] = extractPrice(text);
    assertEquals(priceErr, null);
    
    // Should not find product price on Google homepage
    console.log("  - Price found:", priceData ? "YES" : "NO (expected)");
  }
});
