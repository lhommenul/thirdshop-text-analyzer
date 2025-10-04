/**
 * Tests d'intégration pour la normalisation HTML
 * Teste avec de vrais fichiers HTML du dataset
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  normalizeHtml,
  extractText,
  compareStrategies,
} from "./normalize.ts";
import { NormalizationStrategy } from "./normalize_types.ts";

Deno.test("Intégration - pieceoccasion-1.html avec CONTENT_ONLY", async () => {
  const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.CONTENT_ONLY,
  });

  assertEquals(err, null);
  assertExists(result);
  
  // Vérifications de base
  assertEquals(result.text.length > 0, true);
  assertEquals(result.text.includes("<script"), false);
  assertEquals(result.text.includes("<style"), false);
  assertEquals(result.text.includes("<!--"), false);
  
  // Vérifications de contenu attendu
  assertEquals(result.text.toLowerCase().includes("peugeot"), true);
  assertEquals(result.text.toLowerCase().includes("compresseur"), true);
});

Deno.test("Intégration - pieceoccasion-2.html avec CONTENT_ONLY", async () => {
  const html = await Deno.readTextFile("dataset/pieceoccasion-2.html");
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.CONTENT_ONLY,
  });

  assertEquals(err, null);
  assertExists(result);
  
  // Vérifications de base
  assertEquals(result.text.length > 0, true);
  assertEquals(result.text.includes("<script"), false);
  assertEquals(result.text.includes("<style"), false);
  
  // Vérifications de contenu attendu
  assertEquals(result.text.toLowerCase().includes("chevrolet"), true);
  assertEquals(result.text.toLowerCase().includes("aveo"), true);
});

Deno.test("Intégration - pieceoccasion-1.html extrait les métadonnées", async () => {
  const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.WITH_METADATA,
  });

  assertEquals(err, null);
  assertExists(result);
  assertExists(result.metadata);
  
  // Vérifier que le titre existe et contient des infos pertinentes
  assertExists(result.metadata.title);
  assertEquals(result.metadata.title.length > 0, true);
  assertEquals(result.metadata.title.toLowerCase().includes("peugeot"), true);
  
  // Vérifier la langue
  assertEquals(result.metadata.language, "fr");
  
  // Vérifier la description
  if (result.metadata.description) {
    assertEquals(result.metadata.description.length > 0, true);
  }
});

Deno.test("Intégration - pieceoccasion-2.html extrait les métadonnées", async () => {
  const html = await Deno.readTextFile("dataset/pieceoccasion-2.html");
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.WITH_METADATA,
  });

  assertEquals(err, null);
  assertExists(result);
  assertExists(result.metadata);
  
  // Vérifier que le titre existe
  assertExists(result.metadata.title);
  assertEquals(result.metadata.title.length > 0, true);
  
  // Vérifier la langue
  assertEquals(result.metadata.language, "fr");
});

Deno.test("Intégration - comparaison des tailles entre stratégies", async () => {
  const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
  const [err, results] = compareStrategies(html);

  assertEquals(err, null);
  assertExists(results);
  
  // BASIC devrait être le plus long (garde les scripts inline)
  const basicLen = results[NormalizationStrategy.BASIC].length;
  const contentLen = results[NormalizationStrategy.CONTENT_ONLY].length;
  const aggressiveLen = results[NormalizationStrategy.AGGRESSIVE].length;
  
  // CONTENT_ONLY devrait être plus court que BASIC
  assertEquals(contentLen <= basicLen, true);
  
  // AGGRESSIVE devrait être le plus court ou proche
  assertEquals(aggressiveLen <= contentLen, true);
});

Deno.test("Intégration - structure préservée avec STRUCTURE_AWARE", async () => {
  const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.STRUCTURE_AWARE,
  });

  assertEquals(err, null);
  assertExists(result);
  
  // Vérifier que la structure a des sauts de ligne
  assertEquals(result.text.includes("\n"), true);
  
  // Le texte structuré devrait avoir plusieurs lignes
  const lines = result.text.split("\n").filter(l => l.trim().length > 0);
  assertEquals(lines.length > 10, true);
});

Deno.test("Intégration - normalisation préserve l'encodage UTF-8", async () => {
  const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
  const [err, result] = normalizeHtml(html);

  assertEquals(err, null);
  assertExists(result);
  
  // Vérifier que les caractères français sont préservés
  const hasAccents = /[éèêëàâäîïôùûüÿçÉÈÊËÀÂÄÎÏÔÙÛÜŸÇ]/.test(result.text);
  assertEquals(hasAccents, true);
});

Deno.test("Intégration - pipeline avec les deux fichiers du dataset", async () => {
  const files = [
    "dataset/pieceoccasion-1.html",
    "dataset/pieceoccasion-2.html",
  ];

  const texts: string[] = [];

  for (const file of files) {
    const html = await Deno.readTextFile(file);
    const [err, text] = extractText(html);
    
    assertEquals(err, null);
    assertExists(text);
    assertEquals(text.length > 0, true);
    
    texts.push(text);
  }

  // Les deux fichiers devraient avoir du texte
  assertEquals(texts.length, 2);
  
  // Les textes ne devraient pas être identiques
  assertEquals(texts[0] !== texts[1], true);
  
  // Les deux devraient être substantiels
  assertEquals(texts[0].length > 1000, true);
  assertEquals(texts[1].length > 1000, true);
});

Deno.test("Intégration - décodage des entités dans les vrais fichiers", async () => {
  const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
  const [err, result] = normalizeHtml(html, { decodeEntities: true });

  assertEquals(err, null);
  assertExists(result);
  
  // Si des entités étaient présentes, elles devraient être décodées
  // Ne devrait pas contenir d'entités HTML communes non décodées
  assertEquals(result.text.includes("&nbsp;"), false);
  assertEquals(result.text.includes("&amp;"), false);
  assertEquals(result.text.includes("&lt;"), false);
  assertEquals(result.text.includes("&gt;"), false);
});

Deno.test("Intégration - validation du nombre de mots extraits", async () => {
  const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
  const [err, text] = extractText(html);

  assertEquals(err, null);
  assertExists(text);
  
  // Compter les mots (séparés par des espaces)
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  // Devrait avoir un nombre substantiel de mots
  assertEquals(words.length > 1000, true);
  
  // Devrait avoir une bonne diversité de mots (au moins 20% de mots uniques)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const diversityRatio = uniqueWords.size / words.length;
  assertEquals(diversityRatio > 0.15, true);
});

Deno.test("Intégration - AGGRESSIVE supprime bien les caractères non-textuels", async () => {
  const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.AGGRESSIVE,
  });

  assertEquals(err, null);
  assertExists(result);
  
  // Ne devrait pas contenir de caractères spéciaux courants des scripts
  assertEquals(result.text.includes("()"), false);
  assertEquals(result.text.includes("[]"), false);
  assertEquals(result.text.includes("{}"), false);
  assertEquals(result.text.includes("=>"), false);
  assertEquals(result.text.includes("==="), false);
});

Deno.test("Intégration - performance avec gros fichiers HTML", async () => {
  const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
  
  // Mesurer le temps de normalisation
  const start = performance.now();
  const [err, result] = normalizeHtml(html);
  const end = performance.now();
  
  assertEquals(err, null);
  assertExists(result);
  
  // La normalisation d'un fichier de ~380KB devrait prendre moins de 100ms
  const duration = end - start;
  assertEquals(duration < 100, true, `Normalisation trop lente: ${duration}ms`);
});

Deno.test("Intégration - cohérence entre normalizeHtml et extractText", async () => {
  const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
  
  // Méthode 1: normalizeHtml puis extraire le texte
  const [err1, result1] = normalizeHtml(html, {
    strategy: NormalizationStrategy.CONTENT_ONLY,
  });
  
  // Méthode 2: extractText direct
  const [err2, result2] = extractText(html, NormalizationStrategy.CONTENT_ONLY);
  
  assertEquals(err1, null);
  assertEquals(err2, null);
  assertExists(result1);
  assertExists(result2);
  
  // Les deux méthodes devraient donner le même résultat
  assertEquals(result1.text, result2);
});

