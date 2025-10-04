/**
 * Démonstration rapide de la normalisation HTML
 * Utilise les fichiers du dataset
 * 
 * Usage: deno run -A demo_normalize.ts
 */

// deno-lint-ignore-file no-explicit-any
// @ts-ignore-file
// @ts-ignore: Deno runtime
const globalDeno = (globalThis as any).Deno || {
  readTextFile: async (path: string) => "",
  exit: (code: number) => { throw new Error(`Exit with code ${code}`); }
};

import { normalizeHtml } from "./src/text/normalize.ts";
import { NormalizationStrategy } from "./src/text/normalize_types.ts";

console.log("╔═══════════════════════════════════════════════════════╗");
console.log("║  Démonstration: Normalisation HTML                   ║");
console.log("╚═══════════════════════════════════════════════════════╝\n");

try {
  // Charger le premier fichier HTML du dataset
  console.log("📄 Chargement de dataset/pieceoccasion-1.html...");
  const html = await globalDeno.readTextFile("dataset/pieceoccasion-1.html");
  console.log(`   Taille du fichier HTML: ${html.length} caractères\n`);

  // Normalisation avec métadonnées
  console.log("⚙️  Normalisation avec extraction de métadonnées...");
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.WITH_METADATA,
  });

  if (err || !result) {
    console.error("❌ Erreur:", err?.message || "Résultat null");
    globalDeno.exit(1);
  }

  // À ce stade, result est garanti non-null (assertion de type)
  const normalized = result!;

  // Afficher les métadonnées
  console.log("\n📋 Métadonnées extraites:");
  console.log("   Titre:", normalized.metadata?.title || "N/A");
  console.log(
    "   Description:",
    normalized.metadata?.description?.substring(0, 80) + "..." || "N/A",
  );
  console.log("   Langue:", normalized.metadata?.language || "N/A");
  console.log(
    "   Keywords:",
    normalized.metadata?.keywords?.slice(0, 5).join(", ") || "N/A",
  );

  // Afficher le texte extrait
  console.log("\n📝 Contenu extrait:");
  console.log("   Longueur du texte:", normalized.text.length, "caractères");
  console.log("   Aperçu (300 premiers caractères):");
  console.log("   " + "-".repeat(60));
  console.log("   " + normalized.text.substring(0, 300).replace(/\n/g, " ") + "...");
  console.log("   " + "-".repeat(60));

  // Statistiques basiques
  const mots = normalized.text.split(/\s+/).filter((m) => m.length > 0);
  const motsUniques = new Set(mots.map((m) => m.toLowerCase()));

  console.log("\n📊 Statistiques:");
  console.log("   Nombre de mots:", mots.length);
  console.log("   Mots uniques:", motsUniques.size);
  console.log(
    "   Longueur moyenne des mots:",
    (normalized.text.length / mots.length).toFixed(2),
    "caractères",
  );

  // Top 10 des mots les plus fréquents
  const frequences: Record<string, number> = {};
  for (const mot of mots) {
    const motLower = mot.toLowerCase();
    if (motLower.length >= 3) {
      // Seulement mots de 3+ lettres
      frequences[motLower] = (frequences[motLower] || 0) + 1;
    }
  }

  const top10 = Object.entries(frequences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log("\n🏆 Top 10 des mots les plus fréquents (3+ lettres):");
  top10.forEach(([mot, freq], idx) => {
    console.log(`   ${idx + 1}. "${mot}": ${freq} occurrences`);
  });

  console.log("\n✅ Démonstration terminée avec succès!");
} catch (error: any) {
  console.error("❌ Erreur:", error?.message || String(error));
  globalDeno.exit(1);
}

