/**
 * Exemple d'utilisation du système d'analyse de structure HTML
 * 
 * Usage:
 *   deno run -A examples/analyze_html_structure.ts <fichier.html>
 */

import { analyzeHTMLStructureSync } from "../src/html-structure/mod.ts";

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

async function main() {
  const args = Deno.args;

  if (args.length === 0) {
    console.error("❌ Usage: deno run -A examples/analyze_html_structure.ts <fichier.html>");
    Deno.exit(1);
  }

  const filePath = args[0];

  try {
    // Lire le fichier HTML
    console.log(`📖 Lecture du fichier: ${filePath}\n`);
    const html = await Deno.readTextFile(filePath);

    // Analyser la structure
    console.log("🔍 Analyse de la structure HTML en cours...\n");
    const [err, result] = analyzeHTMLStructureSync(html);

    if (err) {
      console.error(`❌ Erreur d'analyse: ${err.message}`);
      Deno.exit(1);
    }

    // Afficher les résultats
    console.log("=" .repeat(80));
    console.log("📊 RÉSULTATS DE L'ANALYSE");
    console.log("=" .repeat(80));
    console.log();

    // Statistiques globales
    console.log("📈 STATISTIQUES DU DOCUMENT");
    console.log("-".repeat(80));
    console.log(`  • Nombre total de mots: ${result.documentStats.totalWords}`);
    console.log(`  • Nombre total de nœuds HTML: ${result.documentStats.totalNodes}`);
    console.log(`  • Profondeur maximale: ${result.documentStats.maxTreeDepth}`);
    console.log(`  • Types de balises uniques: ${result.documentStats.uniqueTags}`);
    console.log(`  • Balises sémantiques HTML5: ${result.documentStats.hasSemanticHTML ? "✅ Oui" : "❌ Non"}`);
    console.log(`  • Temps de traitement: ${result.processingTimeMs.toFixed(2)}ms`);
    console.log();

    // Top balises
    console.log("🏷️  TOP 5 BALISES LES PLUS UTILISÉES");
    console.log("-".repeat(80));
    result.documentStats.topTags.slice(0, 5).forEach((tag, i) => {
      console.log(`  ${i + 1}. <${tag.tag}> : ${tag.count} occurrences`);
    });
    console.log();

    // Profil de profondeur
    console.log("📏 PROFIL DE PROFONDEUR");
    console.log("-".repeat(80));
    console.log(`  • Profondeur minimale: ${result.depthProfile.minDepth}`);
    console.log(`  • Profondeur maximale: ${result.depthProfile.maxDepth}`);
    console.log(`  • Profondeur moyenne: ${result.depthProfile.averageDepth.toFixed(2)}`);
    console.log(`  • Profondeur médiane: ${result.depthProfile.medianDepth}`);
    console.log(`  • Écart-type: ${result.depthProfile.stdDeviation.toFixed(2)}`);
    console.log(`  • Transitions détectées: ${result.depthProfile.transitions.length}`);
    console.log(`  • Plateaux détectés: ${result.depthProfile.plateaus.length}`);
    console.log();

    // Histogramme de profondeur (simplifié)
    console.log("📊 DISTRIBUTION DES PROFONDEURS");
    console.log("-".repeat(80));
    const sortedDepths = Array.from(result.depthProfile.histogram.entries())
      .sort((a, b) => a[0] - b[0]);
    
    for (const [depth, count] of sortedDepths) {
      const bar = "█".repeat(Math.min(50, Math.floor(count / 2)));
      const percent = ((count / result.allWords.length) * 100).toFixed(1);
      console.log(`  Profondeur ${depth}: ${bar} ${count} mots (${percent}%)`);
    }
    console.log();

    // Blocs d'intérêt détectés
    console.log("🎯 ZONES D'INTÉRÊT DÉTECTÉES");
    console.log("-".repeat(80));
    console.log(`  ${result.blocks.length} zones d'intérêt trouvées\n`);

    if (result.blocks.length === 0) {
      console.log("  ⚠️  Aucune zone d'intérêt détectée avec les critères actuels.");
    } else {
      result.blocks.forEach((block, index) => {
        console.log(`  📍 BLOC #${index + 1}`);
        console.log(`     ├─ Score de qualité: ${(block.score * 100).toFixed(1)}% ${"★".repeat(Math.round(block.score * 5))}`);
        console.log(`     ├─ Nombre de mots: ${block.stats.wordCount}`);
        console.log(`     ├─ Profondeur moyenne: ${block.averageDepth.toFixed(1)} (min: ${block.minDepth}, max: ${block.maxDepth})`);
        console.log(`     ├─ Variance de profondeur: ${block.depthVariance.toFixed(2)}`);
        console.log(`     ├─ Densité textuelle: ${block.stats.textDensity.toFixed(2)}`);
        console.log(`     ├─ Balises dominantes: ${block.dominantTags.join(", ")}`);
        console.log(`     ├─ Balises sémantiques: ${block.stats.hasSemantic ? "✅ " + block.stats.semanticTags.join(", ") : "❌ Aucune"}`);
        
        // Raisons de détection
        console.log(`     ├─ Détecté par:`);
        block.detectionReasons.forEach((reason) => {
          console.log(`     │  • ${reason.explanation}`);
        });
        
        // Preview du texte
        console.log(`     └─ Aperçu du contenu:`);
        const preview = block.textPreview.length > 100 
          ? block.textPreview.substring(0, 100) + "..."
          : block.textPreview;
        console.log(`        "${preview}"`);
        console.log();
      });
    }

    console.log("=" .repeat(80));
    console.log("✅ Analyse terminée avec succès!");
    console.log("=" .repeat(80));

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    Deno.exit(1);
  }
}

// Exécuter
if (import.meta.main) {
  main();
}

