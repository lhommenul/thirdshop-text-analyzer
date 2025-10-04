/**
 * Exemple d'utilisation des fonctions de normalisation HTML
 * Démontre les différentes stratégies sur les fichiers du dataset
 * 
 * Usage: deno run -A examples/normalize_example.ts
 */

// deno-lint-ignore-file no-explicit-any
// @ts-ignore-file
// @ts-ignore: Deno runtime
const globalDeno = (globalThis as any).Deno || {
  readTextFile: async (path: string) => "",
  exit: (code: number) => { throw new Error(`Exit with code ${code}`); }
};

import {
  normalizeHtml,
  extractText,
  compareStrategies,
} from "../src/text/normalize.ts";
import { NormalizationStrategy } from "../src/text/normalize_types.ts";

/**
 * Exemple 1: Normalisation basique
 */
async function exempleBasic() {
  console.log("=== Exemple 1: Normalisation BASIC ===\n");

  const html = await globalDeno.readTextFile("dataset/pieceoccasion-1.html");

  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.BASIC,
  });

  if (err) {
    console.error("Erreur:", err.message);
    return;
  }

  console.log("Longueur du texte extrait:", result.text.length);
  console.log("Aperçu (500 premiers caractères):");
  console.log(result.text.substring(0, 500));
  console.log("\n");
}

/**
 * Exemple 2: Normalisation content-only (recommandée)
 */
async function exempleContentOnly() {
  console.log("=== Exemple 2: Normalisation CONTENT_ONLY ===\n");

  const html = await globalDeno.readTextFile("dataset/pieceoccasion-1.html");

  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.CONTENT_ONLY,
  });

  if (err) {
    console.error("Erreur:", err.message);
    return;
  }

  console.log("Longueur du texte extrait:", result.text.length);
  console.log("Aperçu (500 premiers caractères):");
  console.log(result.text.substring(0, 500));
  console.log("\n");
}

/**
 * Exemple 3: Normalisation avec préservation de structure
 */
async function exempleStructureAware() {
  console.log("=== Exemple 3: Normalisation STRUCTURE_AWARE ===\n");

  const html = await globalDeno.readTextFile("dataset/pieceoccasion-2.html");

  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.STRUCTURE_AWARE,
    preserveLineBreaks: true,
  });

  if (err) {
    console.error("Erreur:", err.message);
    return;
  }

  const lines = result.text.split("\n");
  console.log("Nombre de lignes:", lines.length);
  console.log("Aperçu (10 premières lignes non-vides):");
  lines
    .filter((l) => l.trim().length > 0)
    .slice(0, 10)
    .forEach((line) => console.log("  -", line.substring(0, 80)));
  console.log("\n");
}

/**
 * Exemple 4: Extraction avec métadonnées
 */
async function exempleWithMetadata() {
  console.log("=== Exemple 4: Normalisation WITH_METADATA ===\n");

  const html = await globalDeno.readTextFile("dataset/pieceoccasion-1.html");

  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.WITH_METADATA,
  });

  if (err) {
    console.error("Erreur:", err.message);
    return;
  }

  console.log("Métadonnées extraites:");
  console.log("  Titre:", result.metadata?.title || "N/A");
  console.log(
    "  Description:",
    result.metadata?.description?.substring(0, 100) || "N/A",
  );
  console.log("  Langue:", result.metadata?.language || "N/A");
  console.log(
    "  Keywords:",
    result.metadata?.keywords?.slice(0, 5).join(", ") || "N/A",
  );
  console.log("\nLongueur du contenu:", result.text.length);
  console.log("\n");
}

/**
 * Exemple 5: Normalisation agressive
 */
async function exempleAggressive() {
  console.log("=== Exemple 5: Normalisation AGGRESSIVE ===\n");

  const html = await globalDeno.readTextFile("dataset/pieceoccasion-2.html");

  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.AGGRESSIVE,
  });

  if (err) {
    console.error("Erreur:", err.message);
    return;
  }

  console.log("Longueur du texte nettoyé:", result.text.length);
  console.log("Aperçu (500 premiers caractères):");
  console.log(result.text.substring(0, 500));
  console.log("\n");
}

/**
 * Exemple 6: Comparaison de toutes les stratégies
 */
async function exempleComparaison() {
  console.log("=== Exemple 6: Comparaison des stratégies ===\n");

  // Utiliser un HTML plus petit pour la comparaison
  const htmlSimple = `
    <html lang="fr">
      <head>
        <title>Compresseur air conditionné PEUGEOT 307</title>
        <meta name="description" content="Achetez votre pièce auto d'occasion">
        <script>console.log('tracking');</script>
        <style>.header { color: blue; }</style>
      </head>
      <body>
        <h1>Compresseur air conditionné</h1>
        <p>Pour <strong>PEUGEOT 307</strong></p>
        <p>Prix: 89&euro;</p>
        <!-- Commentaire -->
        <ul>
          <li>Garantie incluse</li>
          <li>Livraison rapide</li>
        </ul>
      </body>
    </html>
  `;

  const [err, results] = compareStrategies(htmlSimple);

  if (err) {
    console.error("Erreur:", err.message);
    return;
  }

  for (const [strategy, text] of Object.entries(results)) {
    console.log(`Stratégie: ${strategy}`);
    console.log(`Longueur: ${text.length} caractères`);
    console.log(`Texte: ${text.substring(0, 100)}...`);
    console.log();
  }
}

/**
 * Exemple 7: Utilisation du helper extractText
 */
async function exempleHelper() {
  console.log("=== Exemple 7: Helper extractText ===\n");

  const html = await globalDeno.readTextFile("dataset/pieceoccasion-1.html");

  // Extraction simple
  const [err, text] = extractText(html);

  if (err) {
    console.error("Erreur:", err.message);
    return;
  }

  // Calculer quelques statistiques
  const mots = text.split(/\s+/);
  const caracteres = text.length;

  console.log("Statistiques du texte extrait:");
  console.log("  Caractères:", caracteres);
  console.log("  Mots:", mots.length);
  console.log("  Longueur moyenne des mots:", (caracteres / mots.length).toFixed(2));
  console.log("\n");
}

/**
 * Exemple 8: Pipeline complet d'analyse
 */
async function exemplePipeline() {
  console.log("=== Exemple 8: Pipeline complet ===\n");

  try {
    // 1. Charger le HTML
    const html = await globalDeno.readTextFile("dataset/pieceoccasion-1.html");
    console.log("1. HTML chargé:", html.length, "caractères");

    // 2. Normaliser avec métadonnées
    const [normErr, normalized] = normalizeHtml(html, {
      strategy: NormalizationStrategy.WITH_METADATA,
    });

    if (normErr) {
      throw normErr;
    }

    console.log("2. HTML normalisé:", normalized.text.length, "caractères");
    console.log("   Titre:", normalized.metadata?.title);

    // 3. Tokenisation simple (à remplacer par vos fonctions de tokenize)
    const mots = normalized.text
      .toLowerCase()
      .split(/\s+/)
      .filter((m) => m.length >= 3);

    console.log("3. Tokenisé:", mots.length, "mots (>= 3 lettres)");

    // 4. Fréquences basiques
    const frequences: Record<string, number> = {};
    for (const mot of mots) {
      frequences[mot] = (frequences[mot] || 0) + 1;
    }

    // 5. Top 10 des mots
    const top10 = Object.entries(frequences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    console.log("4. Top 10 des mots les plus fréquents:");
    top10.forEach(([mot, freq], idx) => {
      console.log(`   ${idx + 1}. "${mot}": ${freq} occurrences`);
    });
    console.log("\n");
  } catch (error) {
    console.error("Erreur dans le pipeline:", error);
  }
}

// Exécution de tous les exemples
// @ts-ignore: main property may not exist
if ((import.meta as any).main !== false) {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  Exemples de normalisation HTML                         ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  await exempleBasic();
  await exempleContentOnly();
  await exempleStructureAware();
  await exempleWithMetadata();
  await exempleAggressive();
  await exempleComparaison();
  await exempleHelper();
  await exemplePipeline();

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  Tous les exemples terminés!                            ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
}

