/**
 * Tests for Context Extractor
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  extractPriceByContext,
  extractReferenceByContext,
  extractWeightByContext,
  extractDimensionsByContext,
  extractBrandByContext,
  extractAllByContext,
} from "./context_extractor.ts";

Deno.test("Context Extractor - Price: labeled close proximity", () => {
  const text = "Prix: 120.00 EUR";

  const [err, matches] = extractPriceByContext(text);

  assert(!err, "Should not error");
  assertEquals(matches.length, 1, "Should find 1 match");
  assertEquals(matches[0].value, "120.00");
  assert(matches[0].confidence > 0.9, "Should have high confidence (close proximity)");
  assertEquals(matches[0].keyword, "Prix");
  assert(matches[0].distance <= 2, "Should be very close (0-2 tokens)");
});

Deno.test("Context Extractor - Price: medium distance", () => {
  const text = "Le prix de vente est de 120.00 EUR pour ce produit.";

  const [err, matches] = extractPriceByContext(text);

  assert(!err);
  assert(matches.length > 0, "Should find match");
  assertEquals(matches[0].value, "120.00");
  assert(
    matches[0].confidence > 0.7 && matches[0].confidence < 0.9,
    "Should have medium confidence (3-5 tokens distance)",
  );
  assert(matches[0].distance >= 3 && matches[0].distance <= 5);
});

Deno.test("Context Extractor - Price: far distance", () => {
  const text =
    "Le prix de vente pour ce produit exceptionnel et de qualité supérieure est de 120.00 EUR.";

  const [err, matches] = extractPriceByContext(text);

  assert(!err);
  if (matches.length > 0) {
    assertEquals(matches[0].value, "120.00");
    assert(matches[0].confidence < 0.7, "Should have lower confidence (far distance)");
    assert(matches[0].distance > 5);
  }
});

Deno.test("Context Extractor - Reference: labeled close", () => {
  const text = "Référence: ABC123456";

  const [err, matches] = extractReferenceByContext(text);

  assert(!err);
  assertEquals(matches.length, 1);
  assertEquals(matches[0].value, "ABC123456");
  assert(matches[0].confidence > 0.9, "Should have high confidence");
  assertEquals(matches[0].keyword, "Référence");
});

Deno.test("Context Extractor - Reference: SKU", () => {
  const text = "SKU 23572714 disponible";

  const [err, matches] = extractReferenceByContext(text);

  assert(!err);
  assertEquals(matches.length, 1);
  assertEquals(matches[0].value, "23572714");
  assertEquals(matches[0].keyword, "SKU");
});

Deno.test("Context Extractor - Weight: kg labeled", () => {
  const text = "Poids: 2.5 kg";

  const [err, matches] = extractWeightByContext(text);

  assert(!err);
  assertEquals(matches.length, 1);
  assertEquals(matches[0].value, "2.5 kg");
  assert(matches[0].confidence > 0.9);
  assertEquals(matches[0].keyword, "Poids");
});

Deno.test("Context Extractor - Weight: sentence", () => {
  const text = "Le poids total du produit est de 2.5 kg.";

  const [err, matches] = extractWeightByContext(text);

  assert(!err);
  assert(matches.length > 0);
  assertEquals(matches[0].value, "2.5 kg");
  assert(matches[0].confidence > 0.7);
});

Deno.test("Context Extractor - Dimensions: 3D labeled", () => {
  const text = "Dimensions: 30 x 20 x 10 cm";

  const [err, matches] = extractDimensionsByContext(text);

  assert(!err);
  assertEquals(matches.length, 1);
  assertEquals(matches[0].value, "30 x 20 x 10 cm");
  assertEquals(matches[0].keyword, "Dimensions");
  assert(matches[0].confidence > 0.9);
});

Deno.test("Context Extractor - Dimensions: 2D", () => {
  const text = "Taille du produit: 50 x 30 cm";

  const [err, matches] = extractDimensionsByContext(text);

  assert(!err);
  assert(matches.length > 0);
  assertEquals(matches[0].value, "50 x 30 cm");
});

Deno.test("Context Extractor - Brand: labeled", () => {
  const text = "Marque: PEUGEOT";

  const [err, matches] = extractBrandByContext(text);

  assert(!err);
  assertEquals(matches.length, 1);
  assertEquals(matches[0].value, "PEUGEOT");
  assertEquals(matches[0].keyword, "Marque");
  assert(matches[0].confidence > 0.9);
});

Deno.test("Context Extractor - Brand: manufacturer", () => {
  const text = "Fabricant Sony pour ce produit";

  const [err, matches] = extractBrandByContext(text);

  assert(!err);
  assert(matches.length > 0);
  assertEquals(matches[0].value, "Sony");
  assertEquals(matches[0].keyword, "Fabricant");
});

Deno.test("Context Extractor - Multiple fields in text", () => {
  const text = `
    Référence: ABC123456
    Prix: 120.00 EUR
    Poids: 2.5 kg
    Dimensions: 30 x 20 x 10 cm
    Marque: PEUGEOT
  `;

  const [err, result] = extractAllByContext(text);

  assert(!err);
  assertExists(result.prices);
  assertExists(result.references);
  assertExists(result.weights);
  assertExists(result.dimensions);
  assertExists(result.brands);

  assertEquals(result.prices.length, 1);
  assertEquals(result.prices[0].value, "120.00");

  assertEquals(result.references.length, 1);
  assertEquals(result.references[0].value, "ABC123456");

  assertEquals(result.weights.length, 1);
  assertEquals(result.weights[0].value, "2.5 kg");

  assertEquals(result.dimensions.length, 1);
  assertEquals(result.dimensions[0].value, "30 x 20 x 10 cm");

  assertEquals(result.brands.length, 1);
  assertEquals(result.brands[0].value, "PEUGEOT");
});

Deno.test("Context Extractor - Empty text", () => {
  const text = "";

  const [err, matches] = extractPriceByContext(text);

  assert(!err);
  assertEquals(matches.length, 0, "Should return empty array for empty text");
});

Deno.test("Context Extractor - No matches", () => {
  const text = "This is a simple text without any price information.";

  const [err, matches] = extractPriceByContext(text);

  assert(!err);
  assertEquals(matches.length, 0, "Should return empty array when no matches");
});

Deno.test("Context Extractor - Window size configuration", () => {
  const text = "Prix 1 2 3 4 5 6 7 8 9 10 11 12 120.00 EUR";

  // Default window (10 tokens)
  const [err1, matches1] = extractPriceByContext(text);
  assert(!err1);
  // Should find match within default window (but with low confidence)

  // Larger window (20 tokens)
  const [err2, matches2] = extractPriceByContext(text, { windowSize: 20 });
  assert(!err2);
  // Should find match with larger window
  assert(matches2.length > 0, "Should find match with larger window");
});

Deno.test("Context Extractor - Multiple keywords same field", () => {
  const text = "Le prix de vente est 120.00 EUR. Tarif: 150.00 EUR.";

  const [err, matches] = extractPriceByContext(text);

  assert(!err);
  assert(matches.length >= 2, "Should find multiple price matches");
  assertEquals(matches[0].value, "120.00");
  assertEquals(matches[1].value, "150.00");
});

Deno.test("Context Extractor - French vs English keywords", () => {
  const textFr = "Prix: 120.00 EUR";
  const textEn = "Price: 120.00 USD";

  const [err1, matchesFr] = extractPriceByContext(textFr);
  const [err2, matchesEn] = extractPriceByContext(textEn);

  assert(!err1);
  assert(!err2);
  assertEquals(matchesFr.length, 1);
  assertEquals(matchesEn.length, 1);
  assertEquals(matchesFr[0].keyword, "Prix");
  assertEquals(matchesEn[0].keyword, "Price");
});

Deno.test("Context Extractor - Case insensitive keywords", () => {
  const text = "PRIX: 120.00 EUR";

  const [err, matches] = extractPriceByContext(text);

  assert(!err);
  assertEquals(matches.length, 1);
  assertEquals(matches[0].value, "120.00");
  // Keyword should match "prix" (case insensitive)
});

Deno.test("Context Extractor - Complex real-world text", () => {
  const text = `
    Compresseur de climatisation pour PEUGEOT 307 SW
    
    Référence fabricant: 23572714
    Marque: DELPHI
    
    Prix de vente: 120.00 EUR TTC
    Poids approximatif: 2.5 kg
    Dimensions: 30 x 20 x 10 cm
    
    État: Neuf
    Garantie: 2 ans
    Livraison gratuite
  `;

  const [err, result] = extractAllByContext(text);

  assert(!err);

  // Prix
  assert(result.prices.length > 0);
  assertEquals(result.prices[0].value, "120.00");

  // Référence
  assert(result.references.length > 0);
  assertEquals(result.references[0].value, "23572714");

  // Poids
  assert(result.weights.length > 0);
  assertEquals(result.weights[0].value, "2.5 kg");

  // Dimensions
  assert(result.dimensions.length > 0);
  assertEquals(result.dimensions[0].value, "30 x 20 x 10 cm");

  // Marque
  assert(result.brands.length > 0);
  assert(result.brands[0].value.includes("DELPHI") || result.brands[0].value.includes("PEUGEOT"));
});
