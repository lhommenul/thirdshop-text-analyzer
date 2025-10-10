/**
 * Tests pour le module d'analyse de structure HTML
 * 
 * @module html-structure/test
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { analyzeHTMLStructureSync, quickAnalyze } from "./analyzer.ts";
import { parseHTMLToStructureTree } from "./html_parser.ts";
import { annotateWordsWithDepth, buildDepthProfile } from "./depth_calculator.ts";

// ============================================================================
// DONNÉES DE TEST
// ============================================================================

const SIMPLE_HTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>Test Page</title>
  </head>
  <body>
    <article>
      <h1>Titre Principal</h1>
      <p>Ceci est un paragraphe de test avec plusieurs mots.</p>
      <p>Un autre paragraphe avec encore plus de contenu textuel.</p>
    </article>
  </body>
</html>
`;

const PRODUCT_HTML = `
<!DOCTYPE html>
<html>
  <body>
    <div class="container">
      <header>
        <nav>Menu Navigation</nav>
      </header>
      <main>
        <article class="product">
          <h1>Nom du Produit</h1>
          <div class="description">
            <p>Description détaillée du produit avec beaucoup de texte.</p>
            <p>Caractéristiques importantes et informations utiles.</p>
            <p>Plus de détails sur le produit et ses avantages.</p>
          </div>
          <div class="price">
            <span>Prix: 99.99€</span>
          </div>
        </article>
      </main>
      <footer>
        <p>Copyright 2024</p>
      </footer>
    </div>
  </body>
</html>
`;

// ============================================================================
// TESTS DE PARSING
// ============================================================================

Deno.test("parseHTMLToStructureTree - HTML simple", () => {
  const [err, tree] = parseHTMLToStructureTree(SIMPLE_HTML);

  assertEquals(err, null);
  assertExists(tree);
  assertEquals(tree.tagName, "html");
  assertEquals(tree.depth, 0);
});

Deno.test("parseHTMLToStructureTree - Balises ignorées", () => {
  const htmlWithScript = `
    <html>
      <body>
        <script>console.log('ignore');</script>
        <p>Contenu visible</p>
      </body>
    </html>
  `;

  const [err, tree] = parseHTMLToStructureTree(htmlWithScript);

  assertEquals(err, null);
  assertExists(tree);

  // Vérifier que le script n'est pas dans l'arbre
  let hasScript = false;
  function checkScript(node: any) {
    if (node.tagName === "script") hasScript = true;
    for (const child of node.children) checkScript(child);
  }
  checkScript(tree);

  assertEquals(hasScript, false);
});

// ============================================================================
// TESTS DE PROFONDEUR
// ============================================================================

Deno.test("annotateWordsWithDepth - Extraction de mots", () => {
  const [err, tree] = parseHTMLToStructureTree(SIMPLE_HTML);
  assertEquals(err, null);
  assertExists(tree);

  const words = annotateWordsWithDepth(tree!);

  // Vérifier qu'on a bien extrait des mots
  assertEquals(words.length > 0, true);

  // Vérifier que chaque mot a les propriétés requises
  for (const word of words) {
    assertExists(word.content);
    assertExists(word.depth);
    assertExists(word.domPath);
    assertExists(word.parentTag);
    assertEquals(typeof word.wordIndex, "number");
  }
});

Deno.test("buildDepthProfile - Profil de profondeur", () => {
  const [err, tree] = parseHTMLToStructureTree(SIMPLE_HTML);
  assertEquals(err, null);
  assertExists(tree);

  const words = annotateWordsWithDepth(tree!);
  const profile = buildDepthProfile(words);

  assertExists(profile);
  assertEquals(typeof profile.minDepth, "number");
  assertEquals(typeof profile.maxDepth, "number");
  assertEquals(typeof profile.averageDepth, "number");
  assertEquals(profile.maxDepth >= profile.minDepth, true);
  assertExists(profile.histogram);
});

// ============================================================================
// TESTS D'ANALYSE COMPLÈTE
// ============================================================================

Deno.test("analyzeHTMLStructureSync - Analyse simple", () => {
  const [err, result] = analyzeHTMLStructureSync(SIMPLE_HTML);

  assertEquals(err, null);
  assertExists(result);
  assertExists(result.blocks);
  assertExists(result.depthProfile);
  assertExists(result.documentStats);
  assertExists(result.allWords);

  // Vérifier les statistiques du document
  assertEquals(result.documentStats.totalWords > 0, true);
  assertEquals(result.documentStats.totalNodes > 0, true);
});

Deno.test("analyzeHTMLStructureSync - Page produit", () => {
  const [err, result] = analyzeHTMLStructureSync(PRODUCT_HTML);

  assertEquals(err, null);
  assertExists(result);

  // Devrait détecter au moins un bloc d'intérêt
  assertEquals(result.blocks.length > 0, true);

  // Le premier bloc devrait avoir un score
  const firstBlock = result.blocks[0];
  assertEquals(typeof firstBlock.score, "number");
  assertEquals(firstBlock.score >= 0 && firstBlock.score <= 1, true);

  // Vérifier les statistiques du bloc
  assertEquals(firstBlock.stats.wordCount > 0, true);
  assertExists(firstBlock.textPreview);
});

Deno.test("analyzeHTMLStructureSync - Options personnalisées", () => {
  const [err, result] = analyzeHTMLStructureSync(PRODUCT_HTML, {
    maxBlocks: 3,
    minBlockScore: 0.3,
    minBlockSize: 5,
  });

  assertEquals(err, null);
  assertExists(result);

  // Respecter maxBlocks
  assertEquals(result.blocks.length <= 3, true);

  // Tous les blocs doivent respecter le score minimum
  for (const block of result.blocks) {
    assertEquals(block.score >= 0.3, true);
    assertEquals(block.stats.wordCount >= 5, true);
  }
});

// ============================================================================
// TESTS D'ERREUR
// ============================================================================

Deno.test("analyzeHTMLStructureSync - HTML vide", () => {
  const [err, result] = analyzeHTMLStructureSync("");

  assertExists(err);
  assertEquals(result, null);
});

Deno.test("analyzeHTMLStructureSync - HTML invalide", () => {
  const [err, result] = analyzeHTMLStructureSync("<invalid");

  // Deno-dom est tolérant, donc peut réussir à parser
  // mais devrait au moins ne pas crasher
  assertEquals(typeof err === "object" || result !== null, true);
});

// ============================================================================
// TESTS DE PERFORMANCE
// ============================================================================

Deno.test("analyzeHTMLStructureSync - Performance", () => {
  const [err, result] = analyzeHTMLStructureSync(PRODUCT_HTML);

  assertEquals(err, null);
  assertExists(result);

  // Vérifier que le temps de traitement est raisonnable (< 200ms)
  assertEquals(result.processingTimeMs < 200, true);

  console.log(`  ✓ Temps d'analyse: ${result.processingTimeMs.toFixed(2)}ms`);
  console.log(`  ✓ Mots traités: ${result.allWords.length}`);
  console.log(`  ✓ Blocs détectés: ${result.blocks.length}`);
});

// ============================================================================
// TESTS FONCTIONNELS
// ============================================================================

Deno.test("Scénario complet - Analyse d'un document réel", () => {
  const html = `
    <html>
      <body>
        <header>
          <h1>Site Web</h1>
          <nav>Menu</nav>
        </header>
        <main>
          <article>
            <h2>Article Principal</h2>
            <p>Premier paragraphe avec du contenu intéressant et pertinent.</p>
            <p>Deuxième paragraphe continuant le sujet avec plus de détails.</p>
            <p>Troisième paragraphe ajoutant encore plus d'informations utiles.</p>
            <div class="sidebar">
              <p>Information secondaire dans la barre latérale.</p>
            </div>
          </article>
        </main>
        <footer>
          <p>Footer avec copyright</p>
        </footer>
      </body>
    </html>
  `;

  const [err, result] = analyzeHTMLStructureSync(html);

  assertEquals(err, null);
  assertExists(result);

  // Vérifier qu'on a trouvé des blocs
  assertEquals(result.blocks.length > 0, true);

  // Le bloc principal devrait être dans l'article
  const articleBlocks = result.blocks.filter(block =>
    block.dominantTags.includes("p")
  );
  assertEquals(articleBlocks.length > 0, true);

  // Afficher les résultats pour inspection
  console.log("\n  Résultats de l'analyse:");
  console.log(`  - ${result.blocks.length} blocs d'intérêt détectés`);
  console.log(`  - Profondeur max: ${result.depthProfile.maxDepth}`);
  console.log(`  - Total de mots: ${result.documentStats.totalWords}`);

  for (let i = 0; i < Math.min(3, result.blocks.length); i++) {
    const block = result.blocks[i];
    console.log(`\n  Bloc ${i + 1}:`);
    console.log(`    Score: ${(block.score * 100).toFixed(1)}%`);
    console.log(`    Mots: ${block.stats.wordCount}`);
    console.log(`    Profondeur moy: ${block.averageDepth.toFixed(1)}`);
    console.log(`    Preview: ${block.textPreview.substring(0, 60)}...`);
  }
});

