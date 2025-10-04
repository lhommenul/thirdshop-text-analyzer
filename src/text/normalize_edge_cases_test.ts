/**
 * Tests des cas limites et edge cases pour la normalisation HTML
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  normalizeHtml,
  extractText,
  normalizeBasic,
  normalizeContentOnly,
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

Deno.test("Edge case - HTML avec balises mal formées", () => {
  const html = "<p>Test<strong>Bold</p></strong><div>Suite";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Test"), true);
  assertEquals(result.text.includes("Bold"), true);
  assertEquals(result.text.includes("Suite"), true);
});

Deno.test("Edge case - HTML avec attributs contenant des chevrons", () => {
  const html = '<p data-value="<test>">Contenu</p>';
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Contenu"), true);
});

Deno.test("Edge case - HTML avec commentaires imbriqués", () => {
  const html = `
    <p>Avant</p>
    <!-- Commentaire <!-- imbriqué --> -->
    <p>Après</p>
  `;
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Avant"), true);
  assertEquals(result.text.includes("Après"), true);
});

Deno.test("Edge case - HTML avec CDATA sections", () => {
  const html = `
    <p>Texte</p>
    <![CDATA[Contenu CDATA]]>
    <p>Suite</p>
  `;
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Texte"), true);
  assertEquals(result.text.includes("Suite"), true);
});

Deno.test("Edge case - HTML avec scripts inline dans attributs", () => {
  const html = `
    <div onclick="alert('test')">Clic moi</div>
    <a href="javascript:void(0)">Lien</a>
  `;
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Clic moi"), true);
  assertEquals(result.text.includes("Lien"), true);
  // Les handlers devraient être supprimés avec les balises
});

Deno.test("Edge case - HTML avec entités numériques invalides", () => {
  const html = "<p>Test&#999999;et&#xFFFFFF;suite</p>";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Test"), true);
  assertEquals(result.text.includes("suite"), true);
});

Deno.test("Edge case - HTML avec entités non terminées", () => {
  const html = "<p>Test&nbsp&amp;suite</p>";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Test"), true);
  assertEquals(result.text.includes("suite"), true);
});

Deno.test("Edge case - HTML avec balises auto-fermantes non standard", () => {
  const html = "<p>Test<br>Suite<hr>Fin</p>";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Test"), true);
  assertEquals(result.text.includes("Suite"), true);
  assertEquals(result.text.includes("Fin"), true);
});

Deno.test("Edge case - HTML très long (stress test)", () => {
  // Générer un HTML de 1MB
  const longContent = "Test contenu ".repeat(100000);
  const html = `<html><body><p>${longContent}</p></body></html>`;
  
  const start = performance.now();
  const [err, result] = normalizeHtml(html);
  const end = performance.now();

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.length > 0, true);
  
  // Devrait quand même être raisonnablement rapide (< 500ms pour 1MB)
  assertEquals(end - start < 500, true);
});

Deno.test("Edge case - HTML avec multiples espaces et tabs", () => {
  const html = `<p>Test    \t\t   multiples   \t  espaces</p>`;
  const [err, result] = normalizeHtml(html, { normalizeWhitespace: true });

  assertEquals(err, null);
  assertExists(result);
  // Devrait normaliser à un seul espace
  assertEquals(result.text, "Test multiples espaces");
});

Deno.test("Edge case - HTML avec seulement des whitespaces", () => {
  const html = "   \t\n\n   \t   ";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text, "");
});

Deno.test("Edge case - HTML avec balises vides imbriquées", () => {
  const html = "<div><div><div><p></p></div></div></div>";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text, "");
});

Deno.test("Edge case - HTML avec DOCTYPE et XML declaration", () => {
  const html = `
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE html>
    <html>
      <body>Contenu</body>
    </html>
  `;
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Contenu"), true);
  assertEquals(result.text.includes("DOCTYPE"), false);
  assertEquals(result.text.includes("xml"), false);
});

Deno.test("Edge case - HTML avec caractères de contrôle", () => {
  const html = "<p>Test\x00\x01\x02contrôle\x1F</p>";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Test"), true);
  assertEquals(result.text.includes("contrôle"), true);
});

Deno.test("Edge case - HTML avec émojis et caractères Unicode rares", () => {
  const html = "<p>Test 😀🎉🚀 Unicode 𝕌𝕟𝕚𝕔𝕠𝕕𝕖 ℙ𝕣𝕠</p>";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("😀"), true);
  assertEquals(result.text.includes("🎉"), true);
  assertEquals(result.text.includes("Unicode"), true);
});

Deno.test("Edge case - HTML avec balises non fermées", () => {
  const html = "<p>Paragraphe 1<p>Paragraphe 2<div>Division";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Paragraphe 1"), true);
  assertEquals(result.text.includes("Paragraphe 2"), true);
  assertEquals(result.text.includes("Division"), true);
});

Deno.test("Edge case - HTML avec balises mixtes majuscules/minuscules", () => {
  const html = "<P>Test <STRONG>gras</STRONG> et <Em>italique</Em></p>";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Test"), true);
  assertEquals(result.text.includes("gras"), true);
  assertEquals(result.text.includes("italique"), true);
});

Deno.test("Edge case - HTML avec attributs sans guillemets", () => {
  const html = "<div id=test class=container>Contenu</div>";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Contenu"), true);
});

Deno.test("Edge case - HTML avec espaces dans les balises", () => {
  const html = "<  p  >Test<  /  p  >";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Test"), true);
});

Deno.test("Edge case - HTML avec scripts contenant des balises HTML", () => {
  const html = `
    <p>Avant</p>
    <script>
      var html = "<div>Ne pas extraire</div>";
      document.write("<p>Dynamique</p>");
    </script>
    <p>Après</p>
  `;
  const [err, result] = normalizeContentOnly(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Avant"), true);
  assertEquals(result.text.includes("Après"), true);
  assertEquals(result.text.includes("Ne pas extraire"), false);
  assertEquals(result.text.includes("Dynamique"), false);
});

Deno.test("Edge case - HTML avec styles contenant des URLs", () => {
  const html = `
    <style>
      .bg { background: url('image.jpg'); }
      .test { content: "</style>"; }
    </style>
    <p>Contenu visible</p>
  `;
  const [err, result] = normalizeContentOnly(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Contenu visible"), true);
  assertEquals(result.text.includes("background"), false);
  assertEquals(result.text.includes("url"), false);
});

Deno.test("Edge case - HTML avec tableaux complexes", () => {
  const html = `
    <table>
      <thead>
        <tr><th>Col1</th><th>Col2</th></tr>
      </thead>
      <tbody>
        <tr><td>A</td><td>B</td></tr>
        <tr><td>C</td><td>D</td></tr>
      </tbody>
    </table>
  `;
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Col1"), true);
  assertEquals(result.text.includes("Col2"), true);
  assertEquals(result.text.includes("A"), true);
  assertEquals(result.text.includes("D"), true);
});

Deno.test("Edge case - HTML avec listes imbriquées", () => {
  const html = `
    <ul>
      <li>Item 1
        <ul>
          <li>Sous-item 1.1</li>
          <li>Sous-item 1.2</li>
        </ul>
      </li>
      <li>Item 2</li>
    </ul>
  `;
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Item 1"), true);
  assertEquals(result.text.includes("Sous-item 1.1"), true);
  assertEquals(result.text.includes("Item 2"), true);
});

Deno.test("Edge case - Options preserveLineBreaks = true", () => {
  const html = "<p>Ligne 1</p>\n<p>Ligne 2</p>\n<p>Ligne 3</p>";
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.STRUCTURE_AWARE,
    preserveLineBreaks: true,
  });

  assertEquals(err, null);
  assertExists(result);
  const lines = result.text.split("\n");
  assertEquals(lines.length > 1, true);
});

Deno.test("Edge case - Options decodeEntities = false", () => {
  const html = "<p>&nbsp;&amp;&lt;&gt;</p>";
  const [err, result] = normalizeHtml(html, { decodeEntities: false });

  assertEquals(err, null);
  assertExists(result);
  // Les entités ne devraient pas être décodées
  assertEquals(result.text.includes("&"), true);
});

Deno.test("Edge case - Options removeEmptyLines = false", () => {
  const html = "<p>Ligne 1</p>\n\n\n<p>Ligne 2</p>";
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.STRUCTURE_AWARE,
    removeEmptyLines: false,
  });

  assertEquals(err, null);
  assertExists(result);
  // Devrait conserver les lignes vides
  assertEquals(result.text.includes("\n"), true);
});

Deno.test("Edge case - HTML avec iframe", () => {
  const html = `
    <p>Avant</p>
    <iframe src="https://example.com">Contenu iframe</iframe>
    <p>Après</p>
  `;
  const [err, result] = normalizeAggressive(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Avant"), true);
  assertEquals(result.text.includes("Après"), true);
  // Le contenu iframe devrait être supprimé avec AGGRESSIVE
  assertEquals(result.text.includes("Contenu iframe"), false);
});

Deno.test("Edge case - HTML avec objets et embeds", () => {
  const html = `
    <p>Texte</p>
    <object data="file.pdf">PDF</object>
    <embed src="file.swf">
  `;
  const [err, result] = normalizeAggressive(html, DEFAULT_OPTIONS);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Texte"), true);
});

Deno.test("Edge case - Performance avec beaucoup de balises", () => {
  // Générer HTML avec 10000 balises
  const items = Array.from({ length: 10000 }, (_, i) => 
    `<li>Item ${i}</li>`
  ).join("");
  const html = `<ul>${items}</ul>`;
  
  const start = performance.now();
  const [err, result] = normalizeHtml(html);
  const end = performance.now();

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Item 0"), true);
  assertEquals(result.text.includes("Item 9999"), true);
  
  // Devrait être rapide même avec beaucoup de balises (< 200ms)
  assertEquals(end - start < 200, true);
});

Deno.test("Edge case - Chaîne vide", () => {
  const [err, result] = normalizeHtml("");

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text, "");
});

Deno.test("Edge case - Uniquement du texte sans HTML", () => {
  const text = "Ceci est juste du texte sans aucune balise HTML";
  const [err, result] = normalizeHtml(text);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text, text);
});

Deno.test("Edge case - HTML minifié sur une seule ligne", () => {
  const html = "<html><head><title>Test</title></head><body><div><p>Contenu</p></div></body></html>";
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  assertEquals(result.text.includes("Contenu"), true);
});

Deno.test("Edge case - extractText avec HTML null/undefined", () => {
  // @ts-expect-error Testing edge case with null
  const [err1, _] = extractText(null);
  assertExists(err1);

  // @ts-expect-error Testing edge case with undefined
  const [err2, __] = extractText(undefined);
  assertExists(err2);
});

