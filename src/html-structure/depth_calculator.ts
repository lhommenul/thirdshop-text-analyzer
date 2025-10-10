/**
 * Module de calcul de profondeur et extraction de mots
 * 
 * Ce module fournit des fonctions pour calculer la profondeur de chaque mot
 * dans un document HTML et créer des annotations complètes.
 * 
 * @module html-structure/depth_calculator
 */

import type {
  DepthProfile,
  DepthPlateau,
  DepthTransition,
  Result,
  StructureNode,
  WordNode,
} from "./types.ts";

// ============================================================================
// CONSTANTES
// ============================================================================

/** Regex pour extraire les mots (Unicode-aware) */
const WORD_REGEX = /[\p{L}\p{N}]+/gu;

/** Magnitude minimale pour détecter une transition significative */
const DEFAULT_TRANSITION_THRESHOLD = 2;

/** Taille minimale d'un plateau (nombre de mots) */
const MIN_PLATEAU_SIZE = 5;

/** Variance maximale pour considérer un plateau comme stable */
const MAX_PLATEAU_VARIANCE = 1.5;

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Extrait les mots d'un texte avec leurs positions
 * 
 * Utilise une regex Unicode-aware pour supporter les caractères accentués
 * et les différentes langues.
 * 
 * @param text - Texte à tokenizer
 * @returns Liste de mots avec leurs positions
 * 
 * @example
 * ```ts
 * const words = extractWords("Hello world! Comment ça va?");
 * // [
 * //   { content: "Hello", start: 0, end: 5 },
 * //   { content: "world", start: 6, end: 11 },
 * //   { content: "Comment", start: 13, end: 20 },
 * //   ...
 * // ]
 * ```
 */
export function extractWords(
  text: string,
): Array<{ content: string; start: number; end: number }> {
  const words: Array<{ content: string; start: number; end: number }> = [];

  // Utiliser matchAll pour obtenir les positions
  const matches = text.matchAll(WORD_REGEX);

  for (const match of matches) {
    if (match.index !== undefined) {
      words.push({
        content: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return words;
}

/**
 * Annote tous les mots d'un arbre avec leurs métadonnées de profondeur
 * 
 * Cette fonction parcourt l'arbre de structure et extrait tous les mots
 * avec leurs informations de profondeur, chemin DOM, etc.
 * 
 * @param tree - Arbre de structure à analyser
 * @returns Liste de WordNode avec toutes les métadonnées
 * 
 * @example
 * ```ts
 * const tree = buildStructureTree(doc.documentElement);
 * const words = annotateWordsWithDepth(tree);
 * console.log(`${words.length} mots extraits`);
 * ```
 */
export function annotateWordsWithDepth(tree: StructureNode): WordNode[] {
  const allWords: WordNode[] = [];
  let globalCharOffset = 0;
  let wordIndex = 0;

  function traverse(node: StructureNode) {
    // Si ce nœud a du texte direct, extraire les mots
    if (node.directText && node.directText.trim().length > 0) {
      const words = extractWords(node.directText);

      for (const word of words) {
        const wordNode: WordNode = {
          content: word.content,
          startIndex: globalCharOffset + word.start,
          endIndex: globalCharOffset + word.end,
          depth: node.depth,
          domPath: node.domPath,
          parentTag: node.tagName,
          parentAttributes: { ...node.attributes },
          wordIndex: wordIndex++,
        };

        allWords.push(wordNode);
      }

      globalCharOffset += node.directText.length + 1; // +1 pour espace
    }

    // Parcourir les enfants
    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(tree);
  return allWords;
}

/**
 * Construit le profil de profondeur d'un document
 * 
 * Analyse la distribution des profondeurs et identifie les transitions
 * et plateaux significatifs.
 * 
 * @param words - Liste de mots annotés
 * @param transitionThreshold - Magnitude minimale pour une transition (optionnel)
 * @returns Profil de profondeur complet
 * 
 * @example
 * ```ts
 * const words = annotateWordsWithDepth(tree);
 * const profile = buildDepthProfile(words);
 * console.log(`Profondeur moyenne: ${profile.averageDepth}`);
 * console.log(`${profile.transitions.length} transitions détectées`);
 * ```
 */
export function buildDepthProfile(
  words: WordNode[],
  transitionThreshold = DEFAULT_TRANSITION_THRESHOLD,
): DepthProfile {
  if (words.length === 0) {
    return createEmptyProfile();
  }

  // Extraire toutes les profondeurs
  const depths = words.map((w) => w.depth);

  // Calculer statistiques de base
  const minDepth = Math.min(...depths);
  const maxDepth = Math.max(...depths);
  const averageDepth = depths.reduce((sum, d) => sum + d, 0) / depths.length;
  const medianDepth = calculateMedian(depths);
  const stdDeviation = calculateStdDeviation(depths, averageDepth);

  // Construire l'histogramme
  const histogram = new Map<number, number>();
  for (const depth of depths) {
    histogram.set(depth, (histogram.get(depth) || 0) + 1);
  }

  // Détecter les transitions
  const transitions = detectTransitions(words, transitionThreshold);

  // Détecter les plateaux
  const plateaus = detectPlateaus(words);

  return {
    minDepth,
    maxDepth,
    averageDepth,
    medianDepth,
    stdDeviation,
    histogram,
    transitions,
    plateaus,
  };
}

/**
 * Calcule la profondeur d'un nœud spécifique
 * 
 * Cette fonction est principalement utilisée pour vérification/debug
 * car la profondeur est déjà calculée lors de buildStructureTree.
 * 
 * @param node - Nœud de structure
 * @returns Profondeur du nœud
 */
export function calculateDepth(node: StructureNode): number {
  return node.depth;
}

// ============================================================================
// DÉTECTION DE TRANSITIONS
// ============================================================================

/**
 * Détecte les transitions significatives de profondeur
 * 
 * Une transition est un changement brusque de profondeur entre deux mots
 * consécutifs ou proches.
 * 
 * @param words - Liste de mots
 * @param threshold - Magnitude minimale pour considérer comme transition
 * @returns Liste des transitions détectées
 */
function detectTransitions(
  words: WordNode[],
  threshold: number,
): DepthTransition[] {
  const transitions: DepthTransition[] = [];

  for (let i = 1; i < words.length; i++) {
    const prevDepth = words[i - 1].depth;
    const currDepth = words[i].depth;
    const magnitude = Math.abs(currDepth - prevDepth);

    if (magnitude >= threshold) {
      transitions.push({
        wordIndex: i,
        fromDepth: prevDepth,
        toDepth: currDepth,
        magnitude,
        type: currDepth > prevDepth ? "increase" : "decrease",
      });
    }
  }

  return transitions;
}

// ============================================================================
// DÉTECTION DE PLATEAUX
// ============================================================================

/**
 * Détecte les plateaux de profondeur (zones stables)
 * 
 * Un plateau est une séquence de mots avec une profondeur relativement stable
 * (faible variance).
 * 
 * @param words - Liste de mots
 * @returns Liste des plateaux détectés
 */
function detectPlateaus(words: WordNode[]): DepthPlateau[] {
  if (words.length < MIN_PLATEAU_SIZE) {
    return [];
  }

  const plateaus: DepthPlateau[] = [];
  let currentPlateau: {
    start: number;
    depths: number[];
  } | null = null;

  for (let i = 0; i < words.length; i++) {
    const depth = words[i].depth;

    if (!currentPlateau) {
      // Démarrer un nouveau plateau
      currentPlateau = { start: i, depths: [depth] };
    } else {
      currentPlateau.depths.push(depth);

      // Calculer la variance du plateau actuel
      const variance = calculateVariance(currentPlateau.depths);

      // Si variance trop élevée, finaliser le plateau précédent et en démarrer un nouveau
      if (variance > MAX_PLATEAU_VARIANCE) {
        // Sauvegarder le plateau si assez long
        if (currentPlateau.depths.length >= MIN_PLATEAU_SIZE) {
          const avgDepth = average(currentPlateau.depths);
          const finalVariance = calculateVariance(currentPlateau.depths);

          plateaus.push({
            startWordIndex: currentPlateau.start,
            endWordIndex: i - 1,
            depth: Math.round(avgDepth),
            length: currentPlateau.depths.length,
            variance: finalVariance,
          });
        }

        // Redémarrer
        currentPlateau = { start: i, depths: [depth] };
      }
    }
  }

  // Finaliser le dernier plateau si valide
  if (
    currentPlateau &&
    currentPlateau.depths.length >= MIN_PLATEAU_SIZE
  ) {
    const variance = calculateVariance(currentPlateau.depths);
    if (variance <= MAX_PLATEAU_VARIANCE) {
      const avgDepth = average(currentPlateau.depths);

      plateaus.push({
        startWordIndex: currentPlateau.start,
        endWordIndex: words.length - 1,
        depth: Math.round(avgDepth),
        length: currentPlateau.depths.length,
        variance,
      });
    }
  }

  return plateaus;
}

// ============================================================================
// UTILITAIRES STATISTIQUES
// ============================================================================

/**
 * Calcule la médiane d'un tableau de nombres
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Calcule l'écart-type d'un tableau de nombres
 */
function calculateStdDeviation(values: number[], mean: number): number {
  if (values.length === 0) return 0;

  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Calcule la variance d'un tableau de nombres
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = average(values);
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));

  return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calcule la moyenne d'un tableau de nombres
 */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Crée un profil vide (pour le cas où il n'y a pas de mots)
 */
function createEmptyProfile(): DepthProfile {
  return {
    minDepth: 0,
    maxDepth: 0,
    averageDepth: 0,
    medianDepth: 0,
    stdDeviation: 0,
    histogram: new Map(),
    transitions: [],
    plateaus: [],
  };
}

// ============================================================================
// FONCTIONS UTILITAIRES D'ANALYSE
// ============================================================================

/**
 * Obtient tous les mots à une profondeur spécifique
 * 
 * @param words - Liste de mots
 * @param depth - Profondeur recherchée
 * @returns Liste des mots à cette profondeur
 */
export function getWordsAtDepth(words: WordNode[], depth: number): WordNode[] {
  return words.filter((w) => w.depth === depth);
}

/**
 * Obtient tous les mots dans une plage de profondeurs
 * 
 * @param words - Liste de mots
 * @param minDepth - Profondeur minimale (inclusive)
 * @param maxDepth - Profondeur maximale (inclusive)
 * @returns Liste des mots dans cette plage
 */
export function getWordsInDepthRange(
  words: WordNode[],
  minDepth: number,
  maxDepth: number,
): WordNode[] {
  return words.filter((w) => w.depth >= minDepth && w.depth <= maxDepth);
}

/**
 * Groupe les mots par profondeur
 * 
 * @param words - Liste de mots
 * @returns Map avec profondeur comme clé et liste de mots comme valeur
 */
export function groupWordsByDepth(
  words: WordNode[],
): Map<number, WordNode[]> {
  const groups = new Map<number, WordNode[]>();

  for (const word of words) {
    const existing = groups.get(word.depth) || [];
    existing.push(word);
    groups.set(word.depth, existing);
  }

  return groups;
}

/**
 * Obtient les statistiques de distribution de profondeur
 * 
 * @param words - Liste de mots
 * @returns Objet avec statistiques détaillées
 */
export function getDepthDistributionStats(words: WordNode[]): {
  totalWords: number;
  uniqueDepths: number;
  mostCommonDepth: number;
  leastCommonDepth: number;
  depthRange: number;
} {
  if (words.length === 0) {
    return {
      totalWords: 0,
      uniqueDepths: 0,
      mostCommonDepth: 0,
      leastCommonDepth: 0,
      depthRange: 0,
    };
  }

  const depths = words.map((w) => w.depth);
  const histogram = new Map<number, number>();

  for (const depth of depths) {
    histogram.set(depth, (histogram.get(depth) || 0) + 1);
  }

  // Trouver profondeur la plus commune
  let mostCommon = 0;
  let maxCount = 0;
  let leastCommon = 0;
  let minCount = Infinity;

  for (const [depth, count] of histogram.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = depth;
    }
    if (count < minCount) {
      minCount = count;
      leastCommon = depth;
    }
  }

  return {
    totalWords: words.length,
    uniqueDepths: histogram.size,
    mostCommonDepth: mostCommon,
    leastCommonDepth: leastCommon,
    depthRange: Math.max(...depths) - Math.min(...depths),
  };
}

/**
 * Calcule le gradient de profondeur (changement moyen entre mots consécutifs)
 * 
 * @param words - Liste de mots
 * @returns Gradient moyen
 */
export function calculateDepthGradient(words: WordNode[]): number {
  if (words.length < 2) return 0;

  let totalChange = 0;

  for (let i = 1; i < words.length; i++) {
    totalChange += Math.abs(words[i].depth - words[i - 1].depth);
  }

  return totalChange / (words.length - 1);
}

