/**
 * Tests for Semantic Extractor
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseHTML } from "linkedom";
import {
  extractFromTable,
  extractFromDefinitionList,
  extractFromList,
  extractAllSemantic,
  findByKey,
  filterByKeywords,
  groupBySource,
} from "./semantic_extractor.ts";

// Helper to create DOM from HTML
function createDOM(html: string) {
  const { document } = parseHTML(html);
  return document as any;
}

Deno.test("Semantic Extractor - Table: simple key-value", () => {
  const html = `
    <table>
      <tr><td>Poids</td><td>2.5 kg</td></tr>
      <tr><td>Dimensions</td><td>30 x 20 cm</td></tr>
    </table>
  `;
  const document = createDOM(html);
  const table = document.querySelector("table");

  const [err, pairs] = extractFromTable(table);

  assert(!err, "Should not error");
  assertEquals(pairs.length, 2, "Should find 2 key-value pairs");
  
  assertEquals(pairs[0].key, "Poids");
  assertEquals(pairs[0].value, "2.5 kg");
  assertEquals(pairs[0].source, "table");
  assert(pairs[0].confidence > 0.8, "Should have high confidence");
  
  assertEquals(pairs[1].key, "Dimensions");
  assertEquals(pairs[1].value, "30 x 20 cm");
});

Deno.test("Semantic Extractor - Table: with th headers", () => {
  const html = `
    <table>
      <thead>
        <tr><th>Caractéristique</th><th>Valeur</th></tr>
      </thead>
      <tbody>
        <tr><td>Référence</td><td>ABC123</td></tr>
        <tr><td>Marque</td><td>PEUGEOT</td></tr>
      </tbody>
    </table>
  `;
  const document = createDOM(html);
  const table = document.querySelector("table");

  const [err, pairs] = extractFromTable(table);

  assert(!err);
  // Should skip header row
  assertEquals(pairs.length, 2);
  assertEquals(pairs[0].key, "Référence");
  assertEquals(pairs[0].value, "ABC123");
  assertEquals(pairs[1].key, "Marque");
  assertEquals(pairs[1].value, "PEUGEOT");
});

Deno.test("Semantic Extractor - Table: empty cells", () => {
  const html = `
    <table>
      <tr><td>Poids</td><td>2.5 kg</td></tr>
      <tr><td></td><td></td></tr>
      <tr><td>Dimensions</td><td></td></tr>
    </table>
  `;
  const document = createDOM(html);
  const table = document.querySelector("table");

  const [err, pairs] = extractFromTable(table);

  assert(!err);
  // Should only extract valid pairs (with non-empty key and value)
  assertEquals(pairs.length, 1);
  assertEquals(pairs[0].key, "Poids");
  assertEquals(pairs[0].value, "2.5 kg");
});

Deno.test("Semantic Extractor - Definition List: simple dl/dt/dd", () => {
  const html = `
    <dl>
      <dt>Poids</dt>
      <dd>2.5 kg</dd>
      <dt>Dimensions</dt>
      <dd>30 x 20 cm</dd>
    </dl>
  `;
  const document = createDOM(html);
  const dl = document.querySelector("dl");

  const [err, pairs] = extractFromDefinitionList(dl);

  assert(!err);
  assertEquals(pairs.length, 2);
  
  assertEquals(pairs[0].key, "Poids");
  assertEquals(pairs[0].value, "2.5 kg");
  assertEquals(pairs[0].source, "dl");
  assert(pairs[0].confidence > 0.8);
  
  assertEquals(pairs[1].key, "Dimensions");
  assertEquals(pairs[1].value, "30 x 20 cm");
});

Deno.test("Semantic Extractor - Definition List: multiple dd per dt", () => {
  const html = `
    <dl>
      <dt>Couleurs disponibles</dt>
      <dd>Rouge</dd>
      <dd>Bleu</dd>
      <dt>Tailles</dt>
      <dd>M</dd>
      <dd>L</dd>
    </dl>
  `;
  const document = createDOM(html);
  const dl = document.querySelector("dl");

  const [err, pairs] = extractFromDefinitionList(dl);

  assert(!err);
  // Should pair each dt with its corresponding dd
  assert(pairs.length >= 2);
  assertEquals(pairs[0].key, "Couleurs disponibles");
  assert(pairs[0].value.includes("Rouge") || pairs[0].value.includes("Bleu"));
});

Deno.test("Semantic Extractor - List: ul with key-value patterns", () => {
  const html = `
    <ul>
      <li>Poids: 2.5 kg</li>
      <li>Dimensions: 30 x 20 cm</li>
      <li>Couleur: Noir</li>
    </ul>
  `;
  const document = createDOM(html);
  const ul = document.querySelector("ul");

  const [err, pairs] = extractFromList(ul);

  assert(!err);
  assertEquals(pairs.length, 3);
  
  assertEquals(pairs[0].key, "Poids");
  assertEquals(pairs[0].value, "2.5 kg");
  assertEquals(pairs[0].source, "list");
  
  assertEquals(pairs[1].key, "Dimensions");
  assertEquals(pairs[1].value, "30 x 20 cm");
  
  assertEquals(pairs[2].key, "Couleur");
  assertEquals(pairs[2].value, "Noir");
});

Deno.test("Semantic Extractor - List: ol with key-value", () => {
  const html = `
    <ol>
      <li>Référence: ABC123</li>
      <li>Marque: PEUGEOT</li>
    </ol>
  `;
  const document = createDOM(html);
  const ol = document.querySelector("ol");

  const [err, pairs] = extractFromList(ol);

  assert(!err);
  assertEquals(pairs.length, 2);
  assertEquals(pairs[0].key, "Référence");
  assertEquals(pairs[0].value, "ABC123");
  assertEquals(pairs[1].key, "Marque");
  assertEquals(pairs[1].value, "PEUGEOT");
});

Deno.test("Semantic Extractor - List: plain text without pattern", () => {
  const html = `
    <ul>
      <li>This is a simple item</li>
      <li>Another plain item</li>
    </ul>
  `;
  const document = createDOM(html);
  const ul = document.querySelector("ul");

  const [err, pairs] = extractFromList(ul);

  assert(!err);
  // Should return empty or low-confidence pairs for items without key:value pattern
  // Depending on implementation, might return 0 pairs
  if (pairs.length > 0) {
    assert(pairs[0].confidence < 0.7, "Plain text should have low confidence");
  }
});

Deno.test("Semantic Extractor - extractAllSemantic: multiple sources", () => {
  const html = `
    <table id="specs">
      <tr><td>Poids</td><td>2.5 kg</td></tr>
    </table>
    <dl>
      <dt>Référence</dt>
      <dd>ABC123</dd>
    </dl>
    <ul>
      <li>Couleur: Noir</li>
    </ul>
  `;
  const document = createDOM(html);

  const [err, pairs] = extractAllSemantic(document);

  assert(!err);
  assertExists(pairs);
  assert(pairs.length >= 3, "Should extract from table, dl, and ul");
  
  // Check sources
  const sources = pairs.map(p => p.source);
  assert(sources.includes("table"), "Should have table source");
  assert(sources.includes("dl"), "Should have dl source");
  assert(sources.includes("list"), "Should have list source");
});

Deno.test("Semantic Extractor - extractAllSemantic: empty document", () => {
  const html = `<div>No semantic structures here</div>`;
  const document = createDOM(html);

  const [err, pairs] = extractAllSemantic(document);

  assert(!err);
  assertEquals(pairs.length, 0, "Should return empty array for document without semantic structures");
});

Deno.test("Semantic Extractor - findByKey", () => {
  const pairs = [
    { key: "Poids", value: "2.5 kg", source: "table", confidence: 0.9 },
    { key: "Dimensions", value: "30 x 20 cm", source: "table", confidence: 0.85 },
    { key: "Couleur", value: "Noir", source: "list", confidence: 0.8 },
  ];

  const poids = findByKey(pairs, "Poids");
  assertExists(poids);
  assertEquals(poids.value, "2.5 kg");

  const notFound = findByKey(pairs, "NotExist");
  assertEquals(notFound, null);
});

Deno.test("Semantic Extractor - findByKey: case insensitive", () => {
  const pairs = [
    { key: "Poids", value: "2.5 kg", source: "table", confidence: 0.9 },
  ];

  const poids = findByKey(pairs, "poids");
  assertExists(poids);
  assertEquals(poids.value, "2.5 kg");
});

Deno.test("Semantic Extractor - filterByKeywords", () => {
  const pairs = [
    { key: "Poids", value: "2.5 kg", source: "table", confidence: 0.9 },
    { key: "Dimensions", value: "30 x 20 cm", source: "table", confidence: 0.85 },
    { key: "Couleur", value: "Noir", source: "list", confidence: 0.8 },
    { key: "Référence", value: "ABC123", source: "dl", confidence: 0.9 },
  ];

  const filtered = filterByKeywords(pairs, ["poids", "dimensions"]);
  assertEquals(filtered.length, 2);
  assertEquals(filtered[0].key, "Poids");
  assertEquals(filtered[1].key, "Dimensions");
});

Deno.test("Semantic Extractor - filterByKeywords: partial match", () => {
  const pairs = [
    { key: "Poids total", value: "2.5 kg", source: "table", confidence: 0.9 },
    { key: "Dimensions produit", value: "30 cm", source: "table", confidence: 0.85 },
  ];

  const filtered = filterByKeywords(pairs, ["poids", "dimensions"]);
  assertEquals(filtered.length, 2, "Should match partial keywords");
});

Deno.test("Semantic Extractor - groupBySource", () => {
  const pairs = [
    { key: "Poids", value: "2.5 kg", source: "table", confidence: 0.9 },
    { key: "Couleur", value: "Noir", source: "list", confidence: 0.8 },
    { key: "Référence", value: "ABC123", source: "table", confidence: 0.9 },
  ];

  const grouped = groupBySource(pairs);
  
  assertExists(grouped.table);
  assertExists(grouped.list);
  assertEquals(grouped.table.length, 2);
  assertEquals(grouped.list.length, 1);
});

Deno.test("Semantic Extractor - Real-world product specs table", () => {
  const html = `
    <table class="product-specs">
      <tr><th colspan="2">Caractéristiques Techniques</th></tr>
      <tr><td>Référence fabricant</td><td>23572714</td></tr>
      <tr><td>Marque</td><td>DELPHI</td></tr>
      <tr><td>Poids net</td><td>2.5 kg</td></tr>
      <tr><td>Dimensions (L×l×H)</td><td>30 × 20 × 10 cm</td></tr>
      <tr><td>État</td><td>Neuf</td></tr>
      <tr><td>Garantie</td><td>2 ans</td></tr>
    </table>
  `;
  const document = createDOM(html);
  const table = document.querySelector("table");

  const [err, pairs] = extractFromTable(table);

  assert(!err);
  assert(pairs.length >= 5, "Should extract at least 5 key-value pairs");
  
  // Check specific values
  const reference = pairs.find(p => p.key.toLowerCase().includes("référence"));
  assertExists(reference);
  assertEquals(reference.value, "23572714");
  
  const marque = pairs.find(p => p.key.toLowerCase().includes("marque"));
  assertExists(marque);
  assertEquals(marque.value, "DELPHI");
  
  const poids = pairs.find(p => p.key.toLowerCase().includes("poids"));
  assertExists(poids);
  assert(poids.value.includes("2.5"));
});

Deno.test("Semantic Extractor - Confidence scoring", () => {
  const html = `
    <table>
      <tr><td>Poids</td><td>2.5 kg</td></tr>
      <tr><td>X</td><td>Y</td></tr>
      <tr><td>VeryLongKeyWithoutSpaces</td><td>ShortVal</td></tr>
    </table>
  `;
  const document = createDOM(html);
  const table = document.querySelector("table");

  const [err, pairs] = extractFromTable(table);

  assert(!err);
  // "Poids: 2.5 kg" should have high confidence (clear key-value)
  const poids = pairs.find(p => p.key === "Poids");
  if (poids) {
    assert(poids.confidence > 0.8, "Clear key-value should have high confidence");
  }
  
  // "X: Y" should have lower confidence (ambiguous)
  const x = pairs.find(p => p.key === "X");
  if (x) {
    assert(x.confidence < 0.7, "Ambiguous key-value should have lower confidence");
  }
});
