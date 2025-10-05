/**
 * Tests for Fusion Module
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  fuseCandidates,
  mergeProductData,
  type ConflictStrategy,
  SOURCE_WEIGHTS,
} from "./fusion.ts";

Deno.test("Fusion - Priority strategy: JSON-LD wins", () => {
  const candidates = [
    { value: 120.00, source: "jsonld", confidence: 0.95 },
    { value: 120.50, source: "opengraph", confidence: 0.90 },
    { value: 119.99, source: "pattern", confidence: 0.60 },
  ];

  const [err, result] = fuseCandidates(candidates, { strategy: "priority" });

  assert(!err, "Should not error");
  assertExists(result);
  assertEquals(result.value, 120.00, "Should select jsonld (highest priority)");
  assertEquals(result.source, "jsonld");
  assertEquals(result.hadConflict, true);
  assert(result.resolution.includes("priority"), "Resolution should mention priority");
});

Deno.test("Fusion - Priority strategy: fallback to lower priority", () => {
  const candidates = [
    { value: 120.50, source: "opengraph", confidence: 0.80 },
    { value: 119.99, source: "pattern", confidence: 0.60 },
  ];

  const [err, result] = fuseCandidates(candidates, { strategy: "priority" });

  assert(!err);
  assertEquals(result.value, 120.50, "Should select opengraph (highest available)");
  assertEquals(result.source, "opengraph");
});

Deno.test("Fusion - Confidence strategy: highest confidence wins", () => {
  const candidates = [
    { value: 120.00, source: "pattern", confidence: 0.60 },
    { value: 120.50, source: "context", confidence: 0.85 },
    { value: 119.99, source: "opengraph", confidence: 0.70 },
  ];

  const [err, result] = fuseCandidates(candidates, { strategy: "confidence" });

  assert(!err);
  assertEquals(result.value, 120.50, "Should select context (highest confidence)");
  assertEquals(result.source, "context");
  assert(result.confidence >= 0.85);
});

Deno.test("Fusion - Voting strategy: weighted average", () => {
  const candidates = [
    { value: 120.00, source: "jsonld", confidence: 0.95 },
    { value: 120.60, source: "opengraph", confidence: 0.80 },
    { value: 120.30, source: "pattern", confidence: 0.60 },
  ];

  const [err, result] = fuseCandidates(candidates, { strategy: "voting" });

  assert(!err);
  assertExists(result.value);
  // Should be weighted average (closer to 120.00 due to higher weights)
  assert(result.value >= 120.00 && result.value <= 120.60, "Should be weighted average");
  assert(!result.resolution || result.resolution.includes("average") || result.resolution.includes("voting"));
});

Deno.test("Fusion - Voting strategy: with tolerance", () => {
  const candidates = [
    { value: 120.00, source: "jsonld", confidence: 0.95 },
    { value: 120.01, source: "opengraph", confidence: 0.90 },
    { value: 119.99, source: "microdata", confidence: 0.85 },
  ];

  const [err, result] = fuseCandidates(candidates, {
    strategy: "voting" as FusionStrategy,
    tolerance: 0.01, // 1% tolerance
  });

  assert(!err);
  // All values within tolerance, should average
  assertExists(result.value);
  assert(result.value >= 119.99 && result.value <= 120.01);
});

Deno.test("Fusion - First strategy: first candidate", () => {
  const candidates = [
    { value: 120.50, source: "pattern", confidence: 0.60 },
    { value: 120.00, source: "jsonld", confidence: 0.95 },
  ];

  const [err, result] = fuseCandidates(candidates, { strategy: "first" });

  assert(!err);
  assertEquals(result.value, 120.50, "Should select first candidate");
  assertEquals(result.source, "pattern");
});

Deno.test("Fusion - Consensus strategy: requires N sources", () => {
  const candidates = [
    { value: 120.00, source: "jsonld", confidence: 0.95 },
    { value: 120.00, source: "opengraph", confidence: 0.90 },
    { value: 119.50, source: "pattern", confidence: 0.60 },
  ];

  const [err, result] = fuseCandidates(candidates, {
    strategy: "consensus",
    consensusCount: 2,
  });

  assert(!err);
  assertEquals(result.value, 120.00, "Should select consensus value (2 sources agree)");
  assert(!result.resolution || result.resolution.includes("consensus") || result.resolution.includes("sources") || result.resolution.includes("priority"));
});

Deno.test("Fusion - Consensus strategy: no consensus", () => {
  const candidates = [
    { value: 120.00, source: "jsonld", confidence: 0.95 },
    { value: 119.00, source: "opengraph", confidence: 0.90 },
    { value: 118.00, source: "pattern", confidence: 0.60 },
  ];

  const [err, result] = fuseCandidates(candidates, {
    strategy: "consensus",
    consensusCount: 2,
  });

  // Should fallback to priority or confidence
  assert(!err);
  assertExists(result);
  // Should select highest priority or confidence
  assert(result.value === 120.00 || result.value === 119.00);
});

Deno.test("Fusion - Single candidate: no conflict", () => {
  const candidates = [
    { value: 120.00, source: "jsonld", confidence: 0.95 },
  ];

  const [err, result] = fuseCandidates(candidates, { strategy: "priority" });

  assert(!err);
  assertEquals(result.value, 120.00);
  assertEquals(result.source, "jsonld");
  assertEquals(result.hadConflict, false, "Single candidate should not be conflict");
});

Deno.test("Fusion - Empty candidates", () => {
  const candidates: any[] = [];

  const [err, result] = fuseCandidates(candidates, { strategy: "priority" });

  assert(err !== null, "Should error on empty candidates");
});

Deno.test("Fusion - String values: voting", () => {
  const candidates = [
    { value: "PEUGEOT", source: "jsonld", confidence: 0.95 },
    { value: "Peugeot", source: "opengraph", confidence: 0.80 },
    { value: "PEUGEOT", source: "pattern", confidence: 0.60 },
  ];

  const [err, result] = fuseCandidates(candidates, { strategy: "voting" });

  assert(!err);
  // Should select most common value (case-insensitive)
  assertEquals(result.value.toUpperCase(), "PEUGEOT");
});

Deno.test("Fusion - String values: priority", () => {
  const candidates = [
    { value: "DELPHI", source: "jsonld", confidence: 0.95 },
    { value: "Generic", source: "pattern", confidence: 0.60 },
  ];

  const [err, result] = fuseCandidates(candidates, { strategy: "priority" });

  assert(!err);
  assertEquals(result.value, "DELPHI");
  assertEquals(result.source, "jsonld");
});

Deno.test("Fusion - SOURCE_WEIGHTS order", () => {
  assertEquals(SOURCE_WEIGHTS.jsonld, 1.0);
  assertEquals(SOURCE_WEIGHTS.microdata, 0.8);
  assertEquals(SOURCE_WEIGHTS.opengraph, 0.6);
  assert(SOURCE_WEIGHTS.pattern < SOURCE_WEIGHTS.context);
  assert(SOURCE_WEIGHTS.jsonld > SOURCE_WEIGHTS.pattern);
});

Deno.test("Fusion - mergeProductData: full product", () => {
  const sources = [
    {
      data: {
        name: "Compresseur",
        price: { amount: 12000, currency: "EUR" },
        reference: "ABC123",
      },
      source: "jsonld",
      confidence: 0.95,
    },
    {
      data: {
        name: "Compressor",
        price: { amount: 12050, currency: "EUR" },
        brand: "PEUGEOT",
      },
      source: "opengraph",
      confidence: 0.80,
    },
  ];

  const [err, merged] = mergeProductData(sources, { strategy: "priority" });

  assert(!err, "Should not error");
  assertExists(merged);
  assertExists(merged.product);
  
  // Name should come from jsonld (priority)
  assertEquals(merged.product.name, "Compresseur");
  
  // Price should come from jsonld
  assertEquals(merged.product.price?.amount, 12000);
  
  // Reference only in jsonld
  assertEquals(merged.product.reference, "ABC123");
  
  // Brand only in opengraph
  assertEquals(merged.product.brand, "PEUGEOT");
});

Deno.test("Fusion - mergeProductData: with voting", () => {
  const sources = [
    {
      data: {
        price: { amount: 12000, currency: "EUR" },
      },
      source: "jsonld",
      confidence: 0.95,
    },
    {
      data: {
        price: { amount: 12010, currency: "EUR" },
      },
      source: "opengraph",
      confidence: 0.80,
    },
    {
      data: {
        price: { amount: 12005, currency: "EUR" },
      },
      source: "pattern",
      confidence: 0.60,
    },
  ];

  const [err, merged] = mergeProductData(sources, { strategy: "voting" });

  assert(!err);
  assertExists(merged.product.price);
  // Should be weighted average
  assert(merged.product.price.amount >= 12000 && merged.product.price.amount <= 12010);
});

Deno.test("Fusion - Confidence calculation", () => {
  const candidates = [
    { value: 120.00, source: "jsonld", confidence: 0.95 },
    { value: 120.50, source: "opengraph", confidence: 0.80 },
  ];

  const [err, result] = fuseCandidates(candidates, { strategy: "priority" });

  assert(!err);
  assertExists(result.confidence);
  assert(result.confidence > 0 && result.confidence <= 1, "Confidence should be in [0,1]");
  // Should be close to selected source's confidence
  assert(Math.abs(result.confidence - 0.95) < 0.2, "Confidence should be close to source");
});

Deno.test("Fusion - Tolerance for numerical values", () => {
  const candidates = [
    { value: 120.00, source: "jsonld", confidence: 0.95 },
    { value: 120.10, source: "opengraph", confidence: 0.90 },
  ];

  // With tight tolerance (0.001 = 0.1%)
  const [err1, result1] = fuseCandidates(candidates, {
    strategy: "voting" as FusionStrategy,
    tolerance: 0.001,
  });
  assert(!err1);
  // 120.10 is 0.08% away from 120.00 → within tolerance → should average
  
  // With loose tolerance (0.1 = 10%)
  const [err2, result2] = fuseCandidates(candidates, {
    strategy: "voting" as FusionStrategy,
    tolerance: 0.1,
  });
  assert(!err2);
  // Should definitely average
  assertExists(result2.value);
});

Deno.test("Fusion - Complex scenario: multiple fields", () => {
  const sources = [
    {
      data: {
        name: "Compresseur climatisation",
        price: { amount: 12000, currency: "EUR" },
        reference: "23572714",
        brand: "DELPHI",
        weight: { value: 2500, unit: "g" },
      },
      source: "jsonld",
      confidence: 0.95,
    },
    {
      data: {
        name: "Compressor AC",
        price: { amount: 12050, currency: "EUR" },
        reference: "23572714",
        brand: "Delphi",
      },
      source: "opengraph",
      confidence: 0.80,
    },
    {
      data: {
        price: { amount: 11999, currency: "EUR" },
        brand: "DELPHI",
      },
      source: "pattern",
      confidence: 0.60,
    },
  ];

  const [err, merged] = mergeProductData(sources, { strategy: "priority" });

  assert(!err);
  assertExists(merged.product);
  
  // Name from jsonld
  assertEquals(merged.product.name, "Compresseur climatisation");
  
  // Price from jsonld
  assertEquals(merged.product.price?.amount, 12000);
  
  // Reference consistent across sources
  assertEquals(merged.product.reference, "23572714");
  
  // Brand from jsonld (priority)
  assertEquals(merged.product.brand, "DELPHI");
  
  // Weight only in jsonld
  assertEquals(merged.product.weight?.value, 2500);
  
  // Check evidence
  assertExists(merged.evidence);
  assert(merged.evidence.length > 0, "Should have evidence entries");
});
