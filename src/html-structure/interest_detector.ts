/**
 * Module de détection des zones d'intérêt dans un document HTML
 * 
 * Ce module implémente 4 algorithmes complémentaires pour détecter
 * les blocs d'intérêt basés sur la structure de profondeur.
 * 
 * @module html-structure/interest_detector
 */

import type {
  Cluster,
  DetectionAlgorithm,
  DetectionReason,
  InterestBlock,
  Point2D,
  WordNode,
} from "./types.ts";

// ============================================================================
// TYPES INTERNES
// ============================================================================

/** Candidat de bloc détecté par un algorithme */
interface BlockCandidate {
  startWordIndex: number;
  endWordIndex: number;
  score: number;
  algorithm: DetectionAlgorithm;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Détecte les blocs d'intérêt en combinant plusieurs algorithmes
 * 
 * Cette fonction applique les 4 algorithmes de détection et fusionne
 * leurs résultats pour identifier les zones les plus intéressantes.
 * 
 * @param words - Liste de mots annotés avec profondeur
 * @param options - Options de configuration des algorithmes
 * @returns Liste de blocs d'intérêt triés par score
 * 
 * @example
 * ```ts
 * const blocks = detectInterestBlocks(words, {
 *   textDensity: { windowSize: 50, minDensity: 0.3 },
 *   depthStability: { windowSize: 30, maxVariance: 2.0 },
 *   clustering: { epsilon: 5.0, minPoints: 5 },
 *   depthTransition: { minMagnitude: 3 }
 * });
 * ```
 */
export function detectInterestBlocks(
  words: WordNode[],
  options: {
    textDensity: { windowSize: number; minDensity: number };
    depthStability: { windowSize: number; maxVariance: number };
    clustering: { epsilon: number; minPoints: number };
    depthTransition: { minMagnitude: number };
  },
): BlockCandidate[] {
  if (words.length === 0) {
    return [];
  }

  // Appliquer chaque algorithme
  const densityCandidates = detectByTextDensity(
    words,
    options.textDensity.windowSize,
    options.textDensity.minDensity,
  );

  const stabilityCandidates = detectByDepthStability(
    words,
    options.depthStability.windowSize,
    options.depthStability.maxVariance,
  );

  const clusterCandidates = detectByClustering(
    words,
    options.clustering.epsilon,
    options.clustering.minPoints,
  );

  const transitionCandidates = detectByDepthTransition(
    words,
    options.depthTransition.minMagnitude,
  );

  // Combiner tous les candidats
  const allCandidates = [
    ...densityCandidates,
    ...stabilityCandidates,
    ...clusterCandidates,
    ...transitionCandidates,
  ];

  // Fusionner les candidats qui se chevauchent
  const mergedCandidates = mergeCandidates(allCandidates);

  return mergedCandidates;
}

// ============================================================================
// ALGORITHME 1 : DENSITÉ TEXTUELLE
// ============================================================================

/**
 * Détecte les zones d'intérêt basées sur la densité textuelle
 * 
 * Utilise une fenêtre glissante pour calculer le nombre de mots
 * par unité de profondeur. Les zones denses sont considérées comme intéressantes.
 * 
 * @param words - Liste de mots
 * @param windowSize - Taille de la fenêtre (nombre de mots)
 * @param minDensity - Densité minimale pour considérer comme intéressant
 * @returns Liste de candidats détectés
 */
function detectByTextDensity(
  words: WordNode[],
  windowSize: number,
  minDensity: number,
): BlockCandidate[] {
  const candidates: BlockCandidate[] = [];

  // Fenêtre glissante
  for (let i = 0; i <= words.length - windowSize; i++) {
    const window = words.slice(i, i + windowSize);

    // Calculer la densité : nombre de mots / profondeur moyenne
    const avgDepth = window.reduce((sum, w) => sum + w.depth, 0) /
      window.length;
    const density = windowSize / (avgDepth || 1);

    if (density >= minDensity) {
      // Calculer un score normalisé (0-1)
      const score = Math.min(density / (minDensity * 2), 1.0);

      candidates.push({
        startWordIndex: i,
        endWordIndex: i + windowSize - 1,
        score,
        algorithm: "text_density" as DetectionAlgorithm,
        metadata: {
          density,
          avgDepth,
          windowSize,
        },
      });
    }
  }

  return candidates;
}

// ============================================================================
// ALGORITHME 2 : STABILITÉ DE PROFONDEUR
// ============================================================================

/**
 * Détecte les zones d'intérêt basées sur la stabilité de profondeur
 * 
 * Les zones où la profondeur varie peu sont considérées comme des blocs
 * de contenu cohérent et structuré.
 * 
 * @param words - Liste de mots
 * @param windowSize - Taille de la fenêtre d'analyse
 * @param maxVariance - Variance maximale tolérée
 * @returns Liste de candidats détectés
 */
function detectByDepthStability(
  words: WordNode[],
  windowSize: number,
  maxVariance: number,
): BlockCandidate[] {
  const candidates: BlockCandidate[] = [];

  // Fenêtre glissante
  for (let i = 0; i <= words.length - windowSize; i++) {
    const window = words.slice(i, i + windowSize);

    // Calculer variance de profondeur
    const depths = window.map((w) => w.depth);
    const avgDepth = depths.reduce((sum, d) => sum + d, 0) / depths.length;
    const variance = depths.reduce(
      (sum, d) => sum + Math.pow(d - avgDepth, 2),
      0,
    ) / depths.length;

    if (variance <= maxVariance) {
      // Score basé sur la stabilité (variance faible = score élevé)
      const score = Math.max(0, 1 - (variance / (maxVariance * 2)));

      candidates.push({
        startWordIndex: i,
        endWordIndex: i + windowSize - 1,
        score,
        algorithm: "depth_stability" as DetectionAlgorithm,
        metadata: {
          variance,
          avgDepth,
          stability: 1 - (variance / maxVariance),
        },
      });
    }
  }

  return candidates;
}

// ============================================================================
// ALGORITHME 3 : CLUSTERING SPATIAL
// ============================================================================

/**
 * Détecte les zones d'intérêt par clustering spatial (DBSCAN)
 * 
 * Les mots sont représentés comme des points 2D (position, profondeur)
 * et regroupés en clusters denses.
 * 
 * @param words - Liste de mots
 * @param epsilon - Rayon de voisinage pour DBSCAN
 * @param minPoints - Nombre minimum de points pour un cluster
 * @returns Liste de candidats détectés
 */
function detectByClustering(
  words: WordNode[],
  epsilon: number,
  minPoints: number,
): BlockCandidate[] {
  // Convertir mots en points 2D
  const points: Point2D[] = words.map((word) => ({
    x: word.wordIndex,
    y: word.depth,
    wordIndex: word.wordIndex,
  }));

  // Appliquer DBSCAN
  const clusters = dbscan(points, epsilon, minPoints);

  // Convertir clusters en candidats
  const candidates: BlockCandidate[] = [];

  for (const cluster of clusters) {
    if (cluster.points.length >= minPoints) {
      // Trouver les indices min/max
      const wordIndices = cluster.points.map((p) => p.wordIndex);
      const startIdx = Math.min(...wordIndices);
      const endIdx = Math.max(...wordIndices);

      // Score basé sur la densité du cluster
      const score = Math.min(cluster.density / 10, 1.0);

      candidates.push({
        startWordIndex: startIdx,
        endWordIndex: endIdx,
        score,
        algorithm: "clustering" as DetectionAlgorithm,
        metadata: {
          clusterSize: cluster.points.length,
          density: cluster.density,
          center: cluster.center,
        },
      });
    }
  }

  return candidates;
}

/**
 * Implémentation de l'algorithme DBSCAN pour clustering
 * 
 * @param points - Points à clusteriser
 * @param epsilon - Rayon de voisinage
 * @param minPoints - Nombre minimum de points
 * @returns Liste de clusters
 */
function dbscan(
  points: Point2D[],
  epsilon: number,
  minPoints: number,
): Cluster[] {
  const clusters: Cluster[] = [];
  const visited = new Set<number>();
  const clustered = new Set<number>();
  let clusterId = 0;

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;

    visited.add(i);
    const neighbors = getNeighbors(points, i, epsilon);

    if (neighbors.length < minPoints) {
      // Point de bruit, ignoré
      continue;
    }

    // Créer un nouveau cluster
    const clusterPoints: Point2D[] = [];
    const queue = [...neighbors];

    while (queue.length > 0) {
      const j = queue.shift()!;

      if (!visited.has(j)) {
        visited.add(j);
        const newNeighbors = getNeighbors(points, j, epsilon);

        if (newNeighbors.length >= minPoints) {
          queue.push(...newNeighbors);
        }
      }

      if (!clustered.has(j)) {
        clustered.add(j);
        clusterPoints.push(points[j]);
      }
    }

    // Calculer le centre du cluster
    const centerX = clusterPoints.reduce((sum, p) => sum + p.x, 0) /
      clusterPoints.length;
    const centerY = clusterPoints.reduce((sum, p) => sum + p.y, 0) /
      clusterPoints.length;

    // Calculer la densité
    const density = clusterPoints.length / (epsilon * epsilon * Math.PI);

    clusters.push({
      id: clusterId++,
      points: clusterPoints,
      center: { x: centerX, y: centerY },
      density,
    });
  }

  return clusters;
}

/**
 * Trouve les voisins d'un point dans un rayon epsilon
 * 
 * @param points - Tous les points
 * @param index - Index du point de référence
 * @param epsilon - Rayon de recherche
 * @returns Indices des voisins
 */
function getNeighbors(
  points: Point2D[],
  index: number,
  epsilon: number,
): number[] {
  const neighbors: number[] = [];
  const point = points[index];

  for (let i = 0; i < points.length; i++) {
    if (i === index) continue;

    const distance = euclideanDistance(point, points[i]);
    if (distance <= epsilon) {
      neighbors.push(i);
    }
  }

  return neighbors;
}

/**
 * Calcule la distance euclidienne entre deux points
 */
function euclideanDistance(p1: Point2D, p2: Point2D): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// ============================================================================
// ALGORITHME 4 : TRANSITIONS DE PROFONDEUR
// ============================================================================

/**
 * Détecte les zones d'intérêt basées sur les transitions de profondeur
 * 
 * Les zones entre deux transitions significatives sont considérées
 * comme des blocs cohérents.
 * 
 * @param words - Liste de mots
 * @param minMagnitude - Magnitude minimale pour une transition significative
 * @returns Liste de candidats détectés
 */
function detectByDepthTransition(
  words: WordNode[],
  minMagnitude: number,
): BlockCandidate[] {
  const candidates: BlockCandidate[] = [];

  // Détecter les transitions
  const transitions: number[] = [];
  for (let i = 1; i < words.length; i++) {
    const magnitude = Math.abs(words[i].depth - words[i - 1].depth);
    if (magnitude >= minMagnitude) {
      transitions.push(i);
    }
  }

  // Créer des blocs entre les transitions
  if (transitions.length === 0) {
    // Pas de transition : tout le document est un bloc
    if (words.length >= 10) {
      candidates.push({
        startWordIndex: 0,
        endWordIndex: words.length - 1,
        score: 0.5,
        algorithm: "depth_transition" as DetectionAlgorithm,
        metadata: {
          hasTransitions: false,
        },
      });
    }
  } else {
    // Premier bloc (avant première transition)
    if (transitions[0] >= 10) {
      candidates.push({
        startWordIndex: 0,
        endWordIndex: transitions[0] - 1,
        score: 0.7,
        algorithm: "depth_transition" as DetectionAlgorithm,
        metadata: {
          transitionBoundary: "start",
        },
      });
    }

    // Blocs entre transitions
    for (let i = 0; i < transitions.length - 1; i++) {
      const start = transitions[i];
      const end = transitions[i + 1] - 1;

      if (end - start >= 10) {
        candidates.push({
          startWordIndex: start,
          endWordIndex: end,
          score: 0.8,
          algorithm: "depth_transition" as DetectionAlgorithm,
          metadata: {
            transitionBoundary: "middle",
          },
        });
      }
    }

    // Dernier bloc (après dernière transition)
    const lastTransition = transitions[transitions.length - 1];
    if (words.length - lastTransition >= 10) {
      candidates.push({
        startWordIndex: lastTransition,
        endWordIndex: words.length - 1,
        score: 0.7,
        algorithm: "depth_transition" as DetectionAlgorithm,
        metadata: {
          transitionBoundary: "end",
        },
      });
    }
  }

  return candidates;
}

// ============================================================================
// FUSION DES CANDIDATS
// ============================================================================

/**
 * Fusionne les candidats qui se chevauchent
 * 
 * Les candidats détectés par différents algorithmes sont fusionnés
 * s'ils ont un chevauchement significatif.
 * 
 * @param candidates - Liste de tous les candidats
 * @returns Liste de candidats fusionnés
 */
function mergeCandidates(candidates: BlockCandidate[]): BlockCandidate[] {
  if (candidates.length === 0) return [];

  // Trier par index de début
  const sorted = [...candidates].sort((a, b) =>
    a.startWordIndex - b.startWordIndex
  );

  const merged: BlockCandidate[] = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // Calculer le chevauchement
    const overlap = calculateOverlap(
      current.startWordIndex,
      current.endWordIndex,
      next.startWordIndex,
      next.endWordIndex,
    );

    // Si chevauchement > 50%, fusionner
    if (overlap > 0.5) {
      // Fusionner en prenant l'union
      current = {
        startWordIndex: Math.min(current.startWordIndex, next.startWordIndex),
        endWordIndex: Math.max(current.endWordIndex, next.endWordIndex),
        score: (current.score + next.score) / 2, // Moyenne des scores
        algorithm: current.algorithm, // Garder le premier algorithme
        metadata: {
          mergedFrom: [current.algorithm, next.algorithm],
          originalScores: [current.score, next.score],
        },
      };
    } else {
      // Pas de chevauchement significatif, sauvegarder le courant
      merged.push(current);
      current = next;
    }
  }

  // Ajouter le dernier
  merged.push(current);

  return merged;
}

/**
 * Calcule le ratio de chevauchement entre deux intervalles
 * 
 * @param start1 - Début du premier intervalle
 * @param end1 - Fin du premier intervalle
 * @param start2 - Début du second intervalle
 * @param end2 - Fin du second intervalle
 * @returns Ratio de chevauchement (0-1)
 */
function calculateOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): number {
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);

  if (overlapEnd < overlapStart) {
    return 0; // Pas de chevauchement
  }

  const overlapSize = overlapEnd - overlapStart + 1;
  const size1 = end1 - start1 + 1;
  const size2 = end2 - start2 + 1;
  const minSize = Math.min(size1, size2);

  return overlapSize / minSize;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Convertit un candidat en bloc d'intérêt complet
 * 
 * @param candidate - Candidat à convertir
 * @param words - Liste complète de mots
 * @param blockId - Identifiant du bloc
 * @returns Bloc d'intérêt complet
 */
export function candidateToInterestBlock(
  candidate: BlockCandidate,
  words: WordNode[],
  blockId: string,
): InterestBlock {
  const blockWords = words.slice(
    candidate.startWordIndex,
    candidate.endWordIndex + 1,
  );

  const depths = blockWords.map((w) => w.depth);
  const avgDepth = depths.reduce((sum, d) => sum + d, 0) / depths.length;
  const minDepth = Math.min(...depths);
  const maxDepth = Math.max(...depths);

  // Calculer variance
  const variance = depths.reduce(
    (sum, d) => sum + Math.pow(d - avgDepth, 2),
    0,
  ) / depths.length;

  // Extraire preview du texte
  const textPreview = blockWords
    .slice(0, 20)
    .map((w) => w.content)
    .join(" ") + (blockWords.length > 20 ? "..." : "");

  // Raisons de détection
  const reasons: DetectionReason[] = [{
    algorithm: candidate.algorithm,
    score: candidate.score,
    explanation: getExplanation(candidate.algorithm, candidate.score),
    metadata: candidate.metadata,
  }];

  // Balises dominantes
  const tagCounts = new Map<string, number>();
  for (const word of blockWords) {
    tagCounts.set(word.parentTag, (tagCounts.get(word.parentTag) || 0) + 1);
  }
  const dominantTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0]);

  return {
    id: blockId,
    startWordIndex: candidate.startWordIndex,
    endWordIndex: candidate.endWordIndex,
    startCharIndex: blockWords[0].startIndex,
    endCharIndex: blockWords[blockWords.length - 1].endIndex,
    words: blockWords,
    score: candidate.score,
    averageDepth: avgDepth,
    minDepth,
    maxDepth,
    depthVariance: variance,
    stats: {
      wordCount: blockWords.length,
      charCount: blockWords.reduce((sum, w) => sum + w.content.length, 0),
      textDensity: blockWords.length / (avgDepth || 1),
      tagDiversity: tagCounts.size,
      hasSemantic: hasSemanticTags(dominantTags),
      semanticTags: dominantTags.filter(isSemanticTag),
      averageWordLength: blockWords.reduce((sum, w) => sum + w.content.length, 0) / blockWords.length,
    },
    detectionReasons: reasons,
    dominantTags,
    textPreview,
  };
}

/**
 * Génère une explication textuelle pour un algorithme
 */
function getExplanation(
  algorithm: DetectionAlgorithm,
  score: number,
): string {
  const scorePercent = Math.round(score * 100);

  switch (algorithm) {
    case "text_density":
      return `Densité textuelle élevée (score: ${scorePercent}%)`;
    case "depth_stability":
      return `Profondeur stable (score: ${scorePercent}%)`;
    case "clustering":
      return `Cluster dense détecté (score: ${scorePercent}%)`;
    case "depth_transition":
      return `Bloc entre transitions (score: ${scorePercent}%)`;
    default:
      return `Détecté avec score: ${scorePercent}%`;
  }
}

/**
 * Vérifie si une liste de balises contient des balises sémantiques
 */
function hasSemanticTags(tags: string[]): boolean {
  return tags.some(isSemanticTag);
}

/**
 * Vérifie si une balise est sémantique (HTML5)
 */
function isSemanticTag(tag: string): boolean {
  const semanticTags = [
    "article",
    "section",
    "main",
    "header",
    "footer",
    "nav",
    "aside",
    "figure",
    "figcaption",
  ];
  return semanticTags.includes(tag.toLowerCase());
}

