/**
 * Intégration de la normalisation HTML avec les autres modules du projet
 * Démontre un pipeline complet : HTML → Normalisation → Tokenisation → TF-IDF
 * 
 * Usage: deno run -A integration_normalize.ts
 */

// deno-lint-ignore-file no-explicit-any
// @ts-ignore: Deno runtime
const globalDeno = (globalThis as any).Deno || {
  readTextFile: async (path: string) => "",
  exit: (code: number) => { throw new Error(`Exit with code ${code}`); }
};

import { normalizeHtml } from "./src/text/normalize.ts";
import { NormalizationStrategy } from "./src/text/normalize_types.ts";
import { termFrequency, type TermFrequency } from "./src/text/tf.ts";
import { idfFromDocs } from "./src/text/idf.ts";
import { tfidfFromDocs, type TfidfVector } from "./src/text/tfidf.ts";

console.log("╔═══════════════════════════════════════════════════════╗");
console.log("║  Pipeline complet: HTML → TF-IDF                     ║");
console.log("╚═══════════════════════════════════════════════════════╝\n");

async function processHtmlFile(filepath: string): Promise<string | null> {
  try {
    // 1. Charger le HTML
    console.log(`📄 Chargement de ${filepath}...`);
    const html = await globalDeno.readTextFile(filepath);

    // 2. Normaliser (stratégie CONTENT_ONLY recommandée)
    console.log("   ⚙️  Normalisation...");
    const [normErr, normalized] = normalizeHtml(html, {
      strategy: NormalizationStrategy.CONTENT_ONLY,
    });

    if (normErr) {
      console.error("   ❌ Erreur de normalisation:", normErr.message);
      return null;
    }

    console.log(`   ✓ Texte extrait: ${normalized.text.length} caractères`);
    
    return normalized.text;
  } catch (error) {
    console.error(`   ❌ Erreur lors du traitement: ${error.message}`);
    return null;
  }
}

async function main() {
  try {
    // Traiter les deux fichiers du dataset
    const files = [
      "dataset/pieceoccasion-1.html",
      "dataset/pieceoccasion-2.html",
    ];

    console.log("🔄 Traitement des fichiers HTML...\n");

    const documents: string[] = [];

    for (const file of files) {
      const text = await processHtmlFile(file);
      if (text) {
        documents.push(text);
      }
      console.log();
    }

    if (documents.length === 0) {
      console.error("❌ Aucun document traité avec succès");
      globalDeno.exit(1);
    }

    console.log(`✅ ${documents.length} documents traités avec succès\n`);

    // Calculer TF pour chaque document
    console.log("📊 Calcul des fréquences de termes (TF)...");
    const tfResults: TermFrequency[] = [];
    for (let i = 0; i < documents.length; i++) {
      const [err, tf] = termFrequency(documents[i], { 
        asRelative: true,
        normalizeHtml: false, // Déjà normalisé
        minTokenLength: 3
      });
      if (err) {
        console.error(`   ❌ Erreur TF document ${i + 1}:`, err.message);
        continue;
      }
      if (tf) {
        tfResults.push(tf);
        const termsCount = Object.keys(tf).length;
        console.log(`   ✓ Document ${i + 1}: ${termsCount} termes uniques`);
      }
    }

    // Calculer IDF
    console.log("\n📊 Calcul de l'IDF...");
    const [idfErr, idf] = idfFromDocs(documents, { 
      smooth: true,
      normalizeHtml: false, // Déjà normalisé
      minTokenLength: 3
    });
    if (idfErr || !idf) {
      console.error("   ❌ Erreur IDF:", idfErr?.message || "IDF est null");
      globalDeno.exit(1);
    }
    // À ce stade, idf est garanti non-null
    console.log(`   ✓ IDF calculé pour ${Object.keys(idf!).length} termes`);

    // Calculer TF-IDF
    console.log("\n📊 Calcul du TF-IDF...");
    const [tfidfErr, tfidfResults] = tfidfFromDocs(documents, {
      idfSmooth: true,
      normalizeHtml: false, // Déjà normalisé
      minTokenLength: 3
    });
    if (tfidfErr || !tfidfResults) {
      console.error("   ❌ Erreur TF-IDF:", tfidfErr?.message || "TF-IDF est null");
      globalDeno.exit(1);
    }

    // À ce stade, tfidfResults est garanti non-null
    const results = tfidfResults!;

    // Afficher les résultats
    console.log("\n🏆 Top 15 des termes par TF-IDF pour chaque document:\n");

    for (let i = 0; i < results.length; i++) {
      console.log(`Document ${i + 1} (${files[i]}):`);

      const sorted = Object.entries(results[i])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      sorted.forEach(([term, score], idx) => {
        console.log(`   ${idx + 1}. "${term}": ${score.toFixed(4)}`);
      });
      console.log();
    }

    // Trouver les termes communs avec TF-IDF élevé
    console.log("🔍 Analyse des termes communs:\n");

    const termsDoc1 = new Set(Object.keys(results[0]));
    const termsDoc2 = new Set(Object.keys(results[1]));

    const commonTerms = [...termsDoc1].filter((t) => termsDoc2.has(t));
    console.log(`   Termes communs aux deux documents: ${commonTerms.length}`);

    // Top termes communs par TF-IDF moyen
    const commonTfidf = commonTerms
      .map((term) => ({
        term,
        avgScore: (results[0][term] + results[1][term]) / 2,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);

    console.log("\n   Top 10 termes communs (TF-IDF moyen):");
    commonTfidf.forEach((item, idx) => {
      console.log(`   ${idx + 1}. "${item.term}": ${item.avgScore.toFixed(4)}`);
    });

    // Termes distinctifs
    console.log("\n🎯 Termes distinctifs (présents dans un seul document):\n");

    const uniqueDoc1 = [...termsDoc1].filter((t) => !termsDoc2.has(t));
    const uniqueDoc2 = [...termsDoc2].filter((t) => !termsDoc1.has(t));

    console.log(`   Document 1: ${uniqueDoc1.length} termes uniques`);
    const topUniqueDoc1 = uniqueDoc1
      .map((term) => ({ term, score: results[0][term] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    topUniqueDoc1.forEach((item, idx) => {
      console.log(`   ${idx + 1}. "${item.term}": ${item.score.toFixed(4)}`);
    });

    console.log(`\n   Document 2: ${uniqueDoc2.length} termes uniques`);
    const topUniqueDoc2 = uniqueDoc2
      .map((term) => ({ term, score: results[1][term] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    topUniqueDoc2.forEach((item, idx) => {
      console.log(`   ${idx + 1}. "${item.term}": ${item.score.toFixed(4)}`);
    });

    console.log("\n✅ Pipeline complet terminé avec succès!");
  } catch (error: any) {
    console.error("❌ Erreur:", error?.message || String(error));
    globalDeno.exit(1);
  }
}

// @ts-ignore: main property may not exist
if ((import.meta as any).main !== false) {
  main();
}

