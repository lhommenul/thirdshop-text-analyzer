/**
 * Module d'analyse et de scoring des blocs d'intérêt
 * 
 * Ce module fournit des fonctions pour analyser les caractéristiques
 * des blocs détectés et calculer des scores composites.
 * 
 * @module html-structure/block_analyzer
 */

import type { InterestBlock } from "./types.ts";

// ============================================================================
// CONSTANTES DE SCORING
// ============================================================================

/** Poids pour chaque critère dans le score composite */
const SCORING_WEIGHTS = {
  textDensity: 0.25,
  depthStability: 0.25,
  semanticPresence: 0.20,
  contentLength: 0.15,
  tagDiversity: 0.15,
};

/** Seuils pour la classification de longueur */
const LENGTH_THRESHOLDS = {
  veryShort: 20,
  short: 50,
  medium: 150,
  long: 300,
};

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Analyse en profondeur un bloc d'intérêt
 * 
 * Enrichit le bloc avec des statistiques et métriques supplémentaires.
 * 
 * @param block - Bloc à analyser
 * @returns Bloc enrichi avec analyses
 * 
 * @example
 * ```ts
 * const analyzed = analyzeBlock(block);
 * console.log(`Qualité du contenu: ${analyzed.contentQuality}`);
 * ```
 */
export function analyzeBlock(block: InterestBlock): InterestBlock {
  // Les statistiques de base sont déjà calculées lors de la création
  // Cette fonction peut ajouter des analyses supplémentaires si nécessaire

  return {
    ...block,
    // Pas de modifications pour l'instant, mais l'extension est possible
  };
}

/**
 * Calcule un score composite pour un bloc d'intérêt
 * 
 * Le score est calculé en combinant plusieurs critères:
 * - Densité textuelle (mots/profondeur)
 * - Stabilité de profondeur (variance faible)
 * - Présence de balises sémantiques
 * - Longueur du contenu
 * - Diversité des balises
 * 
 * @param block - Bloc à scorer
 * @returns Score normalisé entre 0 et 1
 * 
 * @example
 * ```ts
 * const score = scoreBlock(block);
 * if (score > 0.7) {
 *   console.log("Bloc de haute qualité");
 * }
 * ```
 */
export function scoreBlock(block: InterestBlock): number {
  // 1. Score de densité textuelle (normalisé)
  const densityScore = normalizeDensity(block.stats.textDensity);

  // 2. Score de stabilité de profondeur (variance faible = bon)
  const stabilityScore = normalizeStability(block.depthVariance);

  // 3. Score de présence sémantique
  const semanticScore = block.stats.hasSemantic ? 1.0 : 0.3;

  // 4. Score de longueur de contenu
  const lengthScore = normalizeLengthScore(block.stats.wordCount);

  // 5. Score de diversité des balises (mais pas trop)
  const diversityScore = normalizeDiversity(block.stats.tagDiversity);

  // Calculer le score composite pondéré
  const compositeScore =
    densityScore * SCORING_WEIGHTS.textDensity +
    stabilityScore * SCORING_WEIGHTS.depthStability +
    semanticScore * SCORING_WEIGHTS.semanticPresence +
    lengthScore * SCORING_WEIGHTS.contentLength +
    diversityScore * SCORING_WEIGHTS.tagDiversity;

  return Math.min(Math.max(compositeScore, 0), 1);
}

/**
 * Trie et filtre une liste de blocs par score
 * 
 * @param blocks - Liste de blocs à trier
 * @param maxBlocks - Nombre maximum de blocs à retourner
 * @param minScore - Score minimum requis
 * @returns Liste triée et filtrée
 * 
 * @example
 * ```ts
 * const topBlocks = rankBlocks(allBlocks, 10, 0.5);
 * console.log(`${topBlocks.length} blocs de qualité trouvés`);
 * ```
 */
export function rankBlocks(
  blocks: InterestBlock[],
  maxBlocks = 10,
  minScore = 0.5,
): InterestBlock[] {
  // Recalculer les scores pour tous les blocs
  const scoredBlocks = blocks.map((block) => ({
    ...block,
    score: scoreBlock(block),
  }));

  // Filtrer par score minimum
  const filtered = scoredBlocks.filter((block) => block.score >= minScore);

  // Trier par score décroissant
  const sorted = filtered.sort((a, b) => b.score - a.score);

  // Limiter au nombre maximum
  return sorted.slice(0, maxBlocks);
}

/**
 * Élimine les blocs qui se chevauchent en gardant les meilleurs
 * 
 * @param blocks - Liste de blocs (doit être triée par score)
 * @returns Liste sans chevauchements
 */
export function removeOverlappingBlocks(
  blocks: InterestBlock[],
): InterestBlock[] {
  if (blocks.length === 0) return [];

  const result: InterestBlock[] = [blocks[0]];

  for (let i = 1; i < blocks.length; i++) {
    const current = blocks[i];
    let hasOverlap = false;

    for (const existing of result) {
      const overlap = calculateOverlapRatio(existing, current);
      if (overlap > 0.3) {
        // Chevauchement significatif
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap) {
      result.push(current);
    }
  }

  return result;
}

// ============================================================================
// FONCTIONS DE NORMALISATION
// ============================================================================

/**
 * Normalise le score de densité textuelle
 * 
 * Densité typique: 0.5 - 5.0
 * Densité optimale: ~2.0
 */
function normalizeDensity(density: number): number {
  if (density < 0.5) return 0.2;
  if (density > 5.0) return 0.5; // Trop dense peut être du bruit

  // Courbe avec optimum à 2.0
  const distance = Math.abs(density - 2.0);
  return Math.max(0, 1 - (distance / 3));
}

/**
 * Normalise le score de stabilité (variance de profondeur)
 * 
 * Variance faible = stable = bon score
 * Variance élevée = instable = mauvais score
 */
function normalizeStability(variance: number): number {
  if (variance <= 1.0) return 1.0;
  if (variance >= 10.0) return 0.0;

  // Décroissance linéaire
  return 1 - (variance / 10);
}

/**
 * Normalise le score de longueur
 * 
 * Trop court: mauvais score
 * Trop long: bon score mais avec diminution légère
 */
function normalizeLengthScore(wordCount: number): number {
  if (wordCount < LENGTH_THRESHOLDS.veryShort) {
    return wordCount / LENGTH_THRESHOLDS.veryShort;
  }

  if (wordCount < LENGTH_THRESHOLDS.short) {
    return 0.6 + 0.3 * (wordCount - LENGTH_THRESHOLDS.veryShort) /
      (LENGTH_THRESHOLDS.short - LENGTH_THRESHOLDS.veryShort);
  }

  if (wordCount < LENGTH_THRESHOLDS.medium) {
    return 0.9 + 0.1 * (wordCount - LENGTH_THRESHOLDS.short) /
      (LENGTH_THRESHOLDS.medium - LENGTH_THRESHOLDS.short);
  }

  // Au-delà de medium, score stable à 1.0
  return 1.0;
}

/**
 * Normalise le score de diversité des balises
 * 
 * Trop peu de diversité: contenu monotone
 * Trop de diversité: peut-être du bruit
 */
function normalizeDiversity(tagCount: number): number {
  if (tagCount <= 1) return 0.3; // Très monotone
  if (tagCount <= 3) return 0.6; // Peu de diversité
  if (tagCount <= 6) return 1.0; // Bonne diversité
  if (tagCount <= 10) return 0.8; // Diversité élevée
  return 0.5; // Trop de diversité, possiblement du bruit
}

// ============================================================================
// ANALYSES COMPLÉMENTAIRES
// ============================================================================

/**
 * Calcule le ratio de chevauchement entre deux blocs
 */
function calculateOverlapRatio(
  block1: InterestBlock,
  block2: InterestBlock,
): number {
  const start = Math.max(block1.startWordIndex, block2.startWordIndex);
  const end = Math.min(block1.endWordIndex, block2.endWordIndex);

  if (end < start) return 0;

  const overlapSize = end - start + 1;
  const size1 = block1.endWordIndex - block1.startWordIndex + 1;
  const size2 = block2.endWordIndex - block2.startWordIndex + 1;
  const minSize = Math.min(size1, size2);

  return overlapSize / minSize;
}

/**
 * Classifie un bloc selon sa longueur
 */
export function classifyBlockLength(
  wordCount: number,
): "very_short" | "short" | "medium" | "long" | "very_long" {
  if (wordCount < LENGTH_THRESHOLDS.veryShort) return "very_short";
  if (wordCount < LENGTH_THRESHOLDS.short) return "short";
  if (wordCount < LENGTH_THRESHOLDS.medium) return "medium";
  if (wordCount < LENGTH_THRESHOLDS.long) return "long";
  return "very_long";
}

/**
 * Évalue la qualité du contenu d'un bloc
 */
export function evaluateContentQuality(
  block: InterestBlock,
): "low" | "medium" | "high" | "excellent" {
  const score = scoreBlock(block);

  if (score < 0.4) return "low";
  if (score < 0.6) return "medium";
  if (score < 0.8) return "high";
  return "excellent";
}

/**
 * Génère un résumé textuel de l'analyse d'un bloc
 */
export function generateBlockSummary(block: InterestBlock): string {
  const quality = evaluateContentQuality(block);
  const length = classifyBlockLength(block.stats.wordCount);
  const semantic = block.stats.hasSemantic ? "avec balises sémantiques" : "sans balises sémantiques";
  
  const summary = [
    `Bloc de qualité ${quality}`,
    `contenant ${block.stats.wordCount} mots (${length})`,
    semantic,
    `profondeur moyenne: ${block.averageDepth.toFixed(1)}`,
    `variance: ${block.depthVariance.toFixed(2)}`,
    `densité: ${block.stats.textDensity.toFixed(2)}`,
  ].join(", ");

  return summary;
}

/**
 * Compare deux blocs et retourne le meilleur
 */
export function selectBestBlock(
  block1: InterestBlock,
  block2: InterestBlock,
): InterestBlock {
  const score1 = scoreBlock(block1);
  const score2 = scoreBlock(block2);

  return score1 >= score2 ? block1 : block2;
}

/**
 * Groupe les blocs par qualité
 */
export function groupBlocksByQuality(blocks: InterestBlock[]): {
  excellent: InterestBlock[];
  high: InterestBlock[];
  medium: InterestBlock[];
  low: InterestBlock[];
} {
  const groups = {
    excellent: [] as InterestBlock[],
    high: [] as InterestBlock[],
    medium: [] as InterestBlock[],
    low: [] as InterestBlock[],
  };

  for (const block of blocks) {
    const quality = evaluateContentQuality(block);
    groups[quality].push(block);
  }

  return groups;
}

/**
 * Calcule des statistiques agrégées pour un ensemble de blocs
 */
export function calculateAggregateStats(blocks: InterestBlock[]): {
  totalBlocks: number;
  totalWords: number;
  averageScore: number;
  averageDepth: number;
  averageLength: number;
  blocksWithSemantic: number;
  qualityDistribution: Record<string, number>;
} {
  if (blocks.length === 0) {
    return {
      totalBlocks: 0,
      totalWords: 0,
      averageScore: 0,
      averageDepth: 0,
      averageLength: 0,
      blocksWithSemantic: 0,
      qualityDistribution: { low: 0, medium: 0, high: 0, excellent: 0 },
    };
  }

  const totalWords = blocks.reduce((sum, b) => sum + b.stats.wordCount, 0);
  const averageScore = blocks.reduce((sum, b) => sum + scoreBlock(b), 0) / blocks.length;
  const averageDepth = blocks.reduce((sum, b) => sum + b.averageDepth, 0) / blocks.length;
  const averageLength = totalWords / blocks.length;
  const blocksWithSemantic = blocks.filter(b => b.stats.hasSemantic).length;

  const qualityGroups = groupBlocksByQuality(blocks);
  const qualityDistribution = {
    low: qualityGroups.low.length,
    medium: qualityGroups.medium.length,
    high: qualityGroups.high.length,
    excellent: qualityGroups.excellent.length,
  };

  return {
    totalBlocks: blocks.length,
    totalWords,
    averageScore,
    averageDepth,
    averageLength,
    blocksWithSemantic,
    qualityDistribution,
  };
}

/**
 * Filtre les blocs selon des critères personnalisés
 */
export function filterBlocks(
  blocks: InterestBlock[],
  criteria: {
    minWords?: number;
    maxWords?: number;
    minScore?: number;
    requireSemantic?: boolean;
    minDepth?: number;
    maxDepth?: number;
  },
): InterestBlock[] {
  return blocks.filter((block) => {
    if (criteria.minWords && block.stats.wordCount < criteria.minWords) {
      return false;
    }
    if (criteria.maxWords && block.stats.wordCount > criteria.maxWords) {
      return false;
    }
    if (criteria.minScore && scoreBlock(block) < criteria.minScore) {
      return false;
    }
    if (criteria.requireSemantic && !block.stats.hasSemantic) {
      return false;
    }
    if (criteria.minDepth && block.averageDepth < criteria.minDepth) {
      return false;
    }
    if (criteria.maxDepth && block.averageDepth > criteria.maxDepth) {
      return false;
    }
    return true;
  });
}

