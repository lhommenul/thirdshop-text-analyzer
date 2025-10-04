/**
 * Tests unitaires pour les fonctions de normalisation HTML
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  normalizeHtml,
  extractText,
  compareStrategies,
  normalizeBasic,
  normalizeContentOnly,
  normalizeStructureAware,
  normalizeWithMetadata,
  normalizeAggressive,
} from "./normalize.ts";
import { NormalizationStrategy } from "./normalize_types.ts";

const DEFAULT_OPTIONS = {
  strategy: NormalizationStrategy.CONTENT_ONLY,
  decodeEntities: true,
  normalizeWhitespace: true,
  removeEmptyLines: true,
  preserveLineBreaks: false,
};

Deno.test("normalizeBasic - supprime les balises HTML simples", () => {
  const html = "<p>Bonjour le <strong>monde</strong>!</p>";
  const [err, result] = normalizeBasic(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text, "Bonjour le monde !");
});

Deno.test("normalizeBasic - gère les balises auto-fermantes", () => {
  const html = "<p>Test<br/>ligne 2<hr/></p>";
  const [err, result] = normalizeBasic(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text, "Test ligne 2");
});

Deno.test("normalizeContentOnly - supprime les scripts", () => {
  const html = `
    <p>Texte visible</p>
    <script>console.log('invisible');</script>
    <p>Encore visible</p>
  `;
  const [err, result] = normalizeContentOnly(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("console.log"), false);
  assertEquals(result.text.includes("Texte visible"), true);
});

Deno.test("normalizeContentOnly - supprime les styles", () => {
  const html = `
    <style>.test { color: red; }</style>
    <p>Contenu important</p>
  `;
  const [err, result] = normalizeContentOnly(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("color"), false);
  assertEquals(result.text.includes("Contenu important"), true);
});

Deno.test("normalizeContentOnly - supprime les commentaires HTML", () => {
  const html = `
    <p>Visible</p>
    <!-- Commentaire invisible -->
    <p>Encore visible</p>
  `;
  const [err, result] = normalizeContentOnly(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Commentaire invisible"), false);
});

Deno.test("normalizeContentOnly - supprime les SVG", () => {
  const html = `
    <p>Texte</p>
    <svg><path d="M0,0"/></svg>
    <p>Suite</p>
  `;
  const [err, result] = normalizeContentOnly(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("path"), false);
  assertEquals(result.text.includes("Texte"), true);
});

Deno.test("normalizeStructureAware - préserve la structure avec sauts de ligne", () => {
  const html = `
    <h1>Titre</h1>
    <p>Paragraphe 1</p>
    <p>Paragraphe 2</p>
  `;
  const [err, result] = normalizeStructureAware(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("\n"), true);
  assertEquals(result.text.includes("Titre"), true);
});

Deno.test("normalizeStructureAware - gère les listes", () => {
  const html = `
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  `;
  const [err, result] = normalizeStructureAware(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Item 1"), true);
  assertEquals(result.text.includes("Item 2"), true);
});

Deno.test("normalizeWithMetadata - extrait le titre", () => {
  const html = `
    <html>
      <head>
        <title>Mon Titre</title>
      </head>
      <body>
        <p>Contenu</p>
      </body>
    </html>
  `;
  const [err, result] = normalizeWithMetadata(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.metadata?.title, "Mon Titre");
});

Deno.test("normalizeWithMetadata - extrait la description", () => {
  const html = `
    <head>
      <meta name="description" content="Ma description">
    </head>
    <body>Contenu</body>
  `;
  const [err, result] = normalizeWithMetadata(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.metadata?.description, "Ma description");
});

Deno.test("normalizeWithMetadata - extrait les keywords", () => {
  const html = `
    <head>
      <meta name="keywords" content="mot1, mot2, mot3">
    </head>
    <body>Contenu</body>
  `;
  const [err, result] = normalizeWithMetadata(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.metadata?.keywords?.length, 3);
  assertEquals(result.metadata?.keywords?.[0], "mot1");
});

Deno.test("normalizeWithMetadata - extrait la langue", () => {
  const html = `<html lang="fr"><body>Contenu</body></html>`;
  const [err, result] = normalizeWithMetadata(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.metadata?.language, "fr");
});

Deno.test("normalizeAggressive - nettoie agressivement", () => {
  const html = `
    <p>Texte @#$ normal!</p>
    <script>alert('test');</script>
  `;
  const [err, result] = normalizeAggressive(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Texte"), true);
  assertEquals(result.text.includes("normal"), true);
  assertEquals(result.text.includes("alert"), false);
});

Deno.test("normalizeAggressive - supprime les caractères spéciaux non-textuels", () => {
  const html = `<p>Test @#$%^& 123 ok</p>`;
  const [err, result] = normalizeAggressive(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Test"), true);
  assertEquals(result.text.includes("@"), false);
  assertEquals(result.text.includes("#"), false);
});

Deno.test("normalizeHtml - utilise la stratégie BASIC", () => {
  const html = "<p>Test</p>";
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.BASIC,
  });

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text, "Test");
});

Deno.test("normalizeHtml - utilise la stratégie CONTENT_ONLY", () => {
  const html = "<p>Test</p><script>alert('hi');</script>";
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.CONTENT_ONLY,
  });

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("alert"), false);
});

Deno.test("normalizeHtml - décode les entités HTML", () => {
  const html = "<p>Test&nbsp;&amp;&nbsp;ok</p>";
  const [err, result] = normalizeHtml(html, { decodeEntities: true });

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("&nbsp;"), false);
  assertEquals(result.text.includes("&"), true);
});

Deno.test("normalizeHtml - décode les entités numériques", () => {
  const html = "<p>Test&#8364;&#x20AC;</p>"; // € symbol
  const [err, result] = normalizeHtml(html, { decodeEntities: true });

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("€"), true);
});

Deno.test("normalizeHtml - normalise les espaces multiples", () => {
  const html = "<p>Test    multiple     espaces</p>";
  const [err, result] = normalizeHtml(html, { normalizeWhitespace: true });

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text, "Test multiple espaces");
});

Deno.test("normalizeHtml - supprime les lignes vides", () => {
  const html = "<p>Ligne 1</p>\n\n\n<p>Ligne 2</p>";
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.STRUCTURE_AWARE,
    removeEmptyLines: true,
  });

  assertEquals(err, null);
  assertExists(result);
  const lines = result.text.split("\n");
  const emptyLines = lines.filter((l) => l.trim() === "");
  assertEquals(emptyLines.length, 0);
});

Deno.test("extractText - helper retourne uniquement le texte", () => {
  const html = "<p>Simple test</p>";
  const [err, text] = extractText(html);

  assertEquals(err, null);
  assertExists(text);
  assertEquals(text, "Simple test");
});

Deno.test("extractText - accepte différentes stratégies", () => {
  const html = "<script>alert('hi');</script><p>Visible</p>";
  const [err, text] = extractText(html, NormalizationStrategy.CONTENT_ONLY);

  assertEquals(err, null);
  assertExists(text);
  assertEquals(text.includes("alert"), false);
  assertEquals(text.includes("Visible"), true);
});

Deno.test("compareStrategies - compare toutes les stratégies", () => {
  const html = `
    <html>
      <head><title>Test</title></head>
      <body>
        <script>alert('hi');</script>
        <p>Contenu visible</p>
      </body>
    </html>
  `;
  const [err, results] = compareStrategies(html);

  assertEquals(err, null);
  assertExists(results);
  assertEquals(Object.keys(results).length, 5);
  assertEquals(results[NormalizationStrategy.BASIC].includes("Contenu"), true);
  assertEquals(
    results[NormalizationStrategy.CONTENT_ONLY].includes("alert"),
    false,
  );
});

Deno.test("normalizeHtml - gère les erreurs de stratégie inconnue", () => {
  const html = "<p>Test</p>";
  const [err, result] = normalizeHtml(html, {
    strategy: "invalid_strategy" as NormalizationStrategy,
  });

  assertExists(err);
  assertEquals(result, null);
  assertEquals(err.message.includes("Unknown strategy"), true);
});

Deno.test("normalizeHtml - gère les HTML vides", () => {
  const [err, result] = normalizeHtml("");

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text, "");
});

Deno.test("normalizeHtml - gère les HTML complexes imbriqués", () => {
  const html = `
    <div>
      <div>
        <div>
          <p>Profondément <strong>imbriqué</strong></p>
        </div>
      </div>
    </div>
  `;
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Profondément"), true);
  assertEquals(result.text.includes("imbriqué"), true);
});

Deno.test("normalizeWithMetadata - gère l'absence de métadonnées", () => {
  const html = "<p>Contenu sans métadonnées</p>";
  const [err, result] = normalizeWithMetadata(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertExists(result.metadata);
  assertEquals(result.text.includes("Contenu"), true);
});

Deno.test("normalizeHtml - préserve les caractères Unicode", () => {
  const html = "<p>Français: éàèùç 中文 日本語 العربية</p>";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("éàèùç"), true);
  assertEquals(result.text.includes("中文"), true);
  assertEquals(result.text.includes("日本語"), true);
  assertEquals(result.text.includes("العربية"), true);
});

Deno.test("normalizeHtml - gère les entités HTML spéciales françaises", () => {
  const html = "<p>&laquo;Test&raquo; avec guillemets</p>";
  const [err, result] = normalizeHtml(html, { decodeEntities: true });

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("«"), true);
  assertEquals(result.text.includes("»"), true);
});

