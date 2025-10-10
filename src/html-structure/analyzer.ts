/**
 * Module principal d'analyse de structure HTML
 * 
 * Ce module orchestre toutes les étapes de l'analyse:
 * parsing, extraction de profondeur, détection des zones d'intérêt,
 * et scoring des blocs.
 * 
 * @module html-structure/analyzer
 */

import {
  countNodes,
  extractTextNodes,
  getMaxDepth,
  getTreeStats,
  parseHTMLToStructureTree,
} from "./html_parser.ts";
import {
  annotateWordsWithDepth,
  buildDepthProfile,
  getDepthDistributionStats,
} from "./depth_calculator.ts";
import {
  candidateToInterestBlock,
  detectInterestBlocks,
} from "./interest_detector.ts";
import {
  rankBlocks,
  removeOverlappingBlocks,
  scoreBlock,
} from "./block_analyzer.ts";

import type {
  AnalysisOptions,
  AnalysisResult,
  DEFAULT_ANALYSIS_OPTIONS,
  DocumentStats,
  InterestBlock,
  Result,
} from "./types.ts";

// Import des valeurs par défaut depuis types.ts
import { DEFAULT_ANALYSIS_OPTIONS as DEFAULT_OPTIONS } from "./types.ts";

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Analyse la structure d'un document HTML et détecte les zones d'intérêt
 * 
 * Cette fonction est le point d'entrée principal du système. Elle:
 * 1. Parse le HTML et construit l'arbre de structure
 * 2. Extrait tous les mots avec leurs métadonnées de profondeur
 * 3. Construit le profil de profondeur du document
 * 4. Applique les algorithmes de détection de zones d'intérêt
 * 5. Score et classe les blocs détectés
 * 6. Retourne les résultats complets
 * 
 * @param html - Chaîne HTML à analyser
 * @param options - Options de configuration (optionnel)
 * @returns Result contenant l'analyse complète ou une erreur
 * 
 * @example
 * ```ts
 * const [err, result] = await analyzeHTMLStructure(htmlContent);
 * if (!err) {
 *   console.log(`${result.blocks.length} zones d'intérêt détectées`);
 *   console.log(`Profondeur max: ${result.depthProfile.maxDepth}`);
 *   for (const block of result.blocks) {
 *     console.log(`Bloc: ${block.textPreview} (score: ${block.score})`);
 *   }
 * }
 * ```
 */
export async function analyzeHTMLStructure(
  html: string,
  options?: Partial<AnalysisOptions>,
): Promise<Result<AnalysisResult>> {
  const startTime = performance.now();

  try {
    // Fusionner les options avec les valeurs par défaut
    const opts = mergeOptions(options);

    // ========================================================================
    // ÉTAPE 1: Parser le HTML et construire l'arbre de structure
    // ========================================================================
    const [parseErr, tree] = parseHTMLToStructureTree(
      html,
      opts.ignoredTags,
    );

    if (parseErr) {
      return [new Error(`Erreur de parsing: ${parseErr.message}`), null];
    }

    // ========================================================================
    // ÉTAPE 2: Extraire tous les mots avec leurs métadonnées de profondeur
    // ========================================================================
    const words = annotateWordsWithDepth(tree);

    if (words.length === 0) {
      return [
        new Error("Aucun mot trouvé dans le document"),
        null,
      ];
    }

    // ========================================================================
    // ÉTAPE 3: Construire le profil de profondeur
    // ========================================================================
    const depthProfile = opts.includeDepthProfile
      ? buildDepthProfile(words)
      : undefined;

    // ========================================================================
    // ÉTAPE 4: Détecter les zones d'intérêt
    // ========================================================================
    const candidates = detectInterestBlocks(words, opts.algorithmParams);

    // ========================================================================
    // ÉTAPE 5: Convertir les candidats en blocs complets
    // ========================================================================
    let blocks: InterestBlock[] = candidates.map((candidate, index) =>
      candidateToInterestBlock(candidate, words, `block_${index}`)
    );

    // ========================================================================
    // ÉTAPE 6: Recalculer les scores et trier
    // ========================================================================
    blocks = blocks.map((block) => ({
      ...block,
      score: scoreBlock(block),
    }));

    // ========================================================================
    // ÉTAPE 7: Filtrer par score minimum et taille minimum
    // ========================================================================
    blocks = blocks.filter(
      (block) =>
        block.score >= opts.minBlockScore &&
        block.stats.wordCount >= opts.minBlockSize,
    );

    // ========================================================================
    // ÉTAPE 8: Éliminer les chevauchements
    // ========================================================================
    blocks = removeOverlappingBlocks(
      blocks.sort((a, b) => b.score - a.score),
    );

    // ========================================================================
    // ÉTAPE 9: Limiter au nombre maximum de blocs
    // ========================================================================
    blocks = blocks.slice(0, opts.maxBlocks);

    // ========================================================================
    // ÉTAPE 10: Calculer les statistiques du document
    // ========================================================================
    const documentStats = calculateDocumentStats(tree, words);

    // ========================================================================
    // RÉSULTAT FINAL
    // ========================================================================
    const endTime = performance.now();
    const processingTimeMs = endTime - startTime;

    const result: AnalysisResult = {
      blocks,
      depthProfile: depthProfile!,
      documentStats,
      allWords: words,
      options: opts,
      processingTimeMs,
    };

    return [null, result];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [
      new Error(`Erreur lors de l'analyse: ${message}`),
      null,
    ];
  }
}

/**
 * Version synchrone de l'analyse (pour compatibilité)
 */
export function analyzeHTMLStructureSync(
  html: string,
  options?: Partial<AnalysisOptions>,
): Result<AnalysisResult> {
  const startTime = performance.now();

  try {
    const opts = mergeOptions(options);

    const [parseErr, tree] = parseHTMLToStructureTree(
      html,
      opts.ignoredTags,
    );

    if (parseErr) {
      return [new Error(`Erreur de parsing: ${parseErr.message}`), null];
    }

    const words = annotateWordsWithDepth(tree);

    if (words.length === 0) {
      return [new Error("Aucun mot trouvé dans le document"), null];
    }

    const depthProfile = opts.includeDepthProfile
      ? buildDepthProfile(words)
      : undefined;

    const candidates = detectInterestBlocks(words, opts.algorithmParams);

    let blocks: InterestBlock[] = candidates.map((candidate, index) =>
      candidateToInterestBlock(candidate, words, `block_${index}`)
    );

    blocks = blocks.map((block) => ({
      ...block,
      score: scoreBlock(block),
    }));

    blocks = blocks.filter(
      (block) =>
        block.score >= opts.minBlockScore &&
        block.stats.wordCount >= opts.minBlockSize,
    );

    blocks = removeOverlappingBlocks(
      blocks.sort((a, b) => b.score - a.score),
    );

    blocks = blocks.slice(0, opts.maxBlocks);

    const documentStats = calculateDocumentStats(tree, words);

    const endTime = performance.now();
    const processingTimeMs = endTime - startTime;

    const result: AnalysisResult = {
      blocks,
      depthProfile: depthProfile!,
      documentStats,
      allWords: words,
      options: opts,
      processingTimeMs,
    };

    return [null, result];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [
      new Error(`Erreur lors de l'analyse: ${message}`),
      null,
    ];
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Fusionne les options utilisateur avec les valeurs par défaut
 */
function mergeOptions(
  userOptions?: Partial<AnalysisOptions>,
): AnalysisOptions {
  if (!userOptions) {
    return DEFAULT_OPTIONS;
  }

  return {
    algorithms: userOptions.algorithms ?? DEFAULT_OPTIONS.algorithms,
    minBlockScore: userOptions.minBlockScore ?? DEFAULT_OPTIONS.minBlockScore,
    minBlockSize: userOptions.minBlockSize ?? DEFAULT_OPTIONS.minBlockSize,
    maxBlocks: userOptions.maxBlocks ?? DEFAULT_OPTIONS.maxBlocks,
    includeStats: userOptions.includeStats ?? DEFAULT_OPTIONS.includeStats,
    includeDepthProfile: userOptions.includeDepthProfile ??
      DEFAULT_OPTIONS.includeDepthProfile,
    ignoredTags: userOptions.ignoredTags ?? DEFAULT_OPTIONS.ignoredTags,
    algorithmParams: {
      textDensity: {
        windowSize: userOptions.algorithmParams?.textDensity?.windowSize ??
          DEFAULT_OPTIONS.algorithmParams.textDensity.windowSize,
        minDensity: userOptions.algorithmParams?.textDensity?.minDensity ??
          DEFAULT_OPTIONS.algorithmParams.textDensity.minDensity,
      },
      depthStability: {
        windowSize: userOptions.algorithmParams?.depthStability?.windowSize ??
          DEFAULT_OPTIONS.algorithmParams.depthStability.windowSize,
        maxVariance: userOptions.algorithmParams?.depthStability?.maxVariance ??
          DEFAULT_OPTIONS.algorithmParams.depthStability.maxVariance,
      },
      clustering: {
        epsilon: userOptions.algorithmParams?.clustering?.epsilon ??
          DEFAULT_OPTIONS.algorithmParams.clustering.epsilon,
        minPoints: userOptions.algorithmParams?.clustering?.minPoints ??
          DEFAULT_OPTIONS.algorithmParams.clustering.minPoints,
      },
      depthTransition: {
        minMagnitude: userOptions.algorithmParams?.depthTransition
            ?.minMagnitude ??
          DEFAULT_OPTIONS.algorithmParams.depthTransition.minMagnitude,
      },
    },
  };
}

/**
 * Calcule les statistiques globales du document
 */
function calculateDocumentStats(
  tree: any,
  words: any[],
): DocumentStats {
  const treeStats = getTreeStats(tree);
  const depthStats = getDepthDistributionStats(words);

  // Compter les balises par type
  const tagCounts = new Map<string, number>();
  function countTags(node: any) {
    const tag = node.tagName.toLowerCase();
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);

    for (const child of node.children || []) {
      countTags(child);
    }
  }
  countTags(tree);

  // Top tags
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Balises sémantiques
  const semanticTags = [
    "article",
    "section",
    "main",
    "header",
    "footer",
    "nav",
    "aside",
  ];
  const hasSemanticHTML = Array.from(tagCounts.keys()).some((tag) =>
    semanticTags.includes(tag)
  );

  return {
    totalWords: words.length,
    totalChars: words.reduce((sum, w) => sum + w.content.length, 0),
    totalNodes: treeStats.totalNodes,
    maxTreeDepth: treeStats.maxDepth,
    uniqueTags: treeStats.uniqueTags.size,
    topTags,
    hasSemanticHTML,
  };
}

// ============================================================================
// FONCTIONS POUR RÉSULTATS SIMPLIFIÉS
// ============================================================================

/**
 * Analyse rapide retournant uniquement les blocs principaux
 * 
 * @param html - HTML à analyser
 * @param maxBlocks - Nombre maximum de blocs à retourner
 * @returns Liste de blocs ou erreur
 */
export async function quickAnalyze(
  html: string,
  maxBlocks = 5,
): Promise<Result<InterestBlock[]>> {
  const [err, result] = await analyzeHTMLStructure(html, {
    maxBlocks,
    minBlockScore: 0.6,
    includeStats: false,
    includeDepthProfile: false,
  });

  if (err) return [err, null];

  return [null, result.blocks];
}

/**
 * Obtient uniquement le meilleur bloc d'un document
 * 
 * @param html - HTML à analyser
 * @returns Meilleur bloc ou erreur
 */
export async function getBestBlock(
  html: string,
): Promise<Result<InterestBlock | null>> {
  const [err, blocks] = await quickAnalyze(html, 1);

  if (err) return [err, null];

  return [null, blocks.length > 0 ? blocks[0] : null];
}

/**
 * Obtient les statistiques de profondeur sans faire l'analyse complète
 * 
 * @param html - HTML à analyser
 * @returns Profil de profondeur ou erreur
 */
export async function getDepthProfile(html: string) {
  const [parseErr, tree] = parseHTMLToStructureTree(html);
  if (parseErr) return [parseErr, null];

  const words = annotateWordsWithDepth(tree);
  const profile = buildDepthProfile(words);

  return [null, profile];
}

// ============================================================================
// EXPORT DE TOUTES LES FONCTIONNALITÉS
// ============================================================================

// Réexporter les fonctions utiles des autres modules
export {
  // Parser
  countNodes,
  extractTextNodes,
  getMaxDepth,
  getTreeStats,
  parseHTMLToStructureTree,
  // Profondeur
  annotateWordsWithDepth,
  buildDepthProfile,
  getDepthDistributionStats,
  // Détection
  candidateToInterestBlock,
  detectInterestBlocks,
  // Analyse
  rankBlocks,
  removeOverlappingBlocks,
  scoreBlock,
};

// Réexporter les types
export type {
  AnalysisOptions,
  AnalysisResult,
  InterestBlock,
  WordNode,
} from "./types.ts";

