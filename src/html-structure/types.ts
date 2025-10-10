/**
 * Types pour l'analyse de structure HTML
 * 
 * Ce module définit les structures de données pour analyser
 * la profondeur et détecter les zones d'intérêt dans un document HTML.
 * 
 * @module html-structure/types
 */

// ============================================================================
// TYPES DE BASE
// ============================================================================

/**
 * Représente un mot extrait du HTML avec ses métadonnées de profondeur
 */
export interface WordNode {
  /** Contenu textuel du mot */
  content: string;
  
  /** Position du début du mot dans le texte original (index de caractère) */
  startIndex: number;
  
  /** Position de fin du mot dans le texte original (index de caractère) */
  endIndex: number;
  
  /** Profondeur du mot dans l'arbre DOM (0 = racine) */
  depth: number;
  
  /** Chemin DOM complet (sélecteur CSS) - ex: "html > body > div.content > p" */
  domPath: string;
  
  /** Nom de la balise parente directe - ex: "p", "div", "span" */
  parentTag: string;
  
  /** Attributs de la balise parente (class, id, etc.) */
  parentAttributes: Record<string, string>;
  
  /** Position ordinale du mot dans le document (0-based) */
  wordIndex: number;
}

/**
 * Représente un nœud de l'arbre de structure HTML
 */
export interface StructureNode {
  /** Type de balise HTML - ex: "div", "p", "span" */
  tagName: string;
  
  /** Profondeur du nœud dans l'arbre (0 = racine) */
  depth: number;
  
  /** Attributs HTML du nœud */
  attributes: Record<string, string>;
  
  /** Texte direct contenu dans ce nœud (sans les enfants) */
  directText: string;
  
  /** Tout le texte contenu (incluant enfants) */
  fullText: string;
  
  /** Nœuds enfants */
  children: StructureNode[];
  
  /** Référence au nœud parent (null si racine) */
  parent: StructureNode | null;
  
  /** Chemin DOM complet vers ce nœud */
  domPath: string;
  
  /** Identifiant unique du nœud dans l'arbre */
  nodeId: string;
}

/**
 * Représente un bloc d'intérêt détecté dans le document
 */
export interface InterestBlock {
  /** Identifiant unique du bloc */
  id: string;
  
  /** Index du premier mot du bloc */
  startWordIndex: number;
  
  /** Index du dernier mot du bloc (inclusif) */
  endWordIndex: number;
  
  /** Position du début du bloc dans le texte original (caractère) */
  startCharIndex: number;
  
  /** Position de fin du bloc dans le texte original (caractère) */
  endCharIndex: number;
  
  /** Liste des mots contenus dans ce bloc */
  words: WordNode[];
  
  /** Score d'intérêt du bloc (0-1, plus élevé = plus intéressant) */
  score: number;
  
  /** Profondeur moyenne des mots dans ce bloc */
  averageDepth: number;
  
  /** Profondeur minimale dans le bloc */
  minDepth: number;
  
  /** Profondeur maximale dans le bloc */
  maxDepth: number;
  
  /** Variance de profondeur (mesure de stabilité) */
  depthVariance: number;
  
  /** Statistiques du bloc */
  stats: BlockStats;
  
  /** Raisons pour lesquelles ce bloc a été détecté */
  detectionReasons: DetectionReason[];
  
  /** Balises parentes dominantes dans ce bloc */
  dominantTags: string[];
  
  /** Extrait textuel du bloc (preview) */
  textPreview: string;
}

/**
 * Statistiques d'un bloc d'intérêt
 */
export interface BlockStats {
  /** Nombre total de mots dans le bloc */
  wordCount: number;
  
  /** Nombre total de caractères */
  charCount: number;
  
  /** Densité textuelle (mots par unité de profondeur) */
  textDensity: number;
  
  /** Diversité des balises parentes (nombre de types différents) */
  tagDiversity: number;
  
  /** Présence de balises sémantiques (article, section, main, etc.) */
  hasSemantic: boolean;
  
  /** Liste des balises sémantiques trouvées */
  semanticTags: string[];
  
  /** Longueur moyenne des mots */
  averageWordLength: number;
}

/**
 * Raison de détection d'un bloc d'intérêt
 */
export interface DetectionReason {
  /** Type d'algorithme qui a détecté ce bloc */
  algorithm: DetectionAlgorithm;
  
  /** Score spécifique à cet algorithme (0-1) */
  score: number;
  
  /** Explication textuelle de la détection */
  explanation: string;
  
  /** Métadonnées supplémentaires spécifiques à l'algorithme */
  metadata?: Record<string, unknown>;
}

/**
 * Types d'algorithmes de détection disponibles
 */
export enum DetectionAlgorithm {
  /** Détection basée sur la densité textuelle */
  TEXT_DENSITY = "text_density",
  
  /** Détection basée sur la stabilité de profondeur */
  DEPTH_STABILITY = "depth_stability",
  
  /** Détection par clustering spatial */
  CLUSTERING = "clustering",
  
  /** Détection des transitions de profondeur */
  DEPTH_TRANSITION = "depth_transition",
}

/**
 * Profil de profondeur d'un document HTML
 */
export interface DepthProfile {
  /** Profondeur minimale trouvée dans le document */
  minDepth: number;
  
  /** Profondeur maximale trouvée dans le document */
  maxDepth: number;
  
  /** Profondeur moyenne de tous les mots */
  averageDepth: number;
  
  /** Profondeur médiane */
  medianDepth: number;
  
  /** Écart-type de la profondeur */
  stdDeviation: number;
  
  /** Histogramme: distribution des mots par profondeur */
  histogram: Map<number, number>;
  
  /** Zones de transition (changements significatifs de profondeur) */
  transitions: DepthTransition[];
  
  /** Plateaux de profondeur (zones stables) */
  plateaus: DepthPlateau[];
}

/**
 * Représente une transition de profondeur dans le document
 */
export interface DepthTransition {
  /** Index du mot où la transition commence */
  wordIndex: number;
  
  /** Profondeur avant la transition */
  fromDepth: number;
  
  /** Profondeur après la transition */
  toDepth: number;
  
  /** Magnitude du changement (valeur absolue) */
  magnitude: number;
  
  /** Type de transition */
  type: "increase" | "decrease";
}

/**
 * Représente un plateau de profondeur (zone stable)
 */
export interface DepthPlateau {
  /** Index du premier mot du plateau */
  startWordIndex: number;
  
  /** Index du dernier mot du plateau */
  endWordIndex: number;
  
  /** Profondeur du plateau */
  depth: number;
  
  /** Longueur du plateau (nombre de mots) */
  length: number;
  
  /** Variance de profondeur dans le plateau */
  variance: number;
}

// ============================================================================
// OPTIONS DE CONFIGURATION
// ============================================================================

/**
 * Configuration pour l'analyse de structure HTML
 */
export interface AnalysisOptions {
  /** Algorithmes de détection à activer */
  algorithms: DetectionAlgorithm[];
  
  /** Score minimum pour qu'un bloc soit considéré comme intéressant (0-1) */
  minBlockScore: number;
  
  /** Nombre minimum de mots pour constituer un bloc */
  minBlockSize: number;
  
  /** Nombre maximum de blocs à retourner (top N) */
  maxBlocks: number;
  
  /** Options spécifiques à chaque algorithme */
  algorithmParams: AlgorithmParameters;
  
  /** Inclure les statistiques détaillées dans le résultat */
  includeStats: boolean;
  
  /** Inclure le profil de profondeur complet */
  includeDepthProfile: boolean;
  
  /** Balises HTML à ignorer lors du parsing */
  ignoredTags: string[];
}

/**
 * Paramètres spécifiques aux algorithmes de détection
 */
export interface AlgorithmParameters {
  /** Paramètres pour la détection par densité textuelle */
  textDensity: {
    /** Taille de la fenêtre glissante (nombre de mots) */
    windowSize: number;
    /** Seuil de densité minimum */
    minDensity: number;
  };
  
  /** Paramètres pour la détection par stabilité de profondeur */
  depthStability: {
    /** Taille de la fenêtre d'analyse */
    windowSize: number;
    /** Variance maximale tolérée pour considérer stable */
    maxVariance: number;
  };
  
  /** Paramètres pour le clustering */
  clustering: {
    /** Rayon epsilon pour DBSCAN */
    epsilon: number;
    /** Nombre minimum de points pour former un cluster */
    minPoints: number;
  };
  
  /** Paramètres pour la détection de transitions */
  depthTransition: {
    /** Magnitude minimale pour considérer comme transition significative */
    minMagnitude: number;
  };
}

/**
 * Valeurs par défaut pour la configuration
 */
export const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = {
  algorithms: [
    DetectionAlgorithm.TEXT_DENSITY,
    DetectionAlgorithm.DEPTH_STABILITY,
    DetectionAlgorithm.CLUSTERING,
    DetectionAlgorithm.DEPTH_TRANSITION,
  ],
  minBlockScore: 0.5,
  minBlockSize: 10,
  maxBlocks: 10,
  includeStats: true,
  includeDepthProfile: true,
  ignoredTags: ["script", "style", "noscript", "iframe", "svg"],
  algorithmParams: {
    textDensity: {
      windowSize: 50,
      minDensity: 0.3,
    },
    depthStability: {
      windowSize: 30,
      maxVariance: 2.0,
    },
    clustering: {
      epsilon: 5.0,
      minPoints: 5,
    },
    depthTransition: {
      minMagnitude: 3,
    },
  },
};

// ============================================================================
// RÉSULTAT D'ANALYSE
// ============================================================================

/**
 * Résultat complet de l'analyse de structure HTML
 */
export interface AnalysisResult {
  /** Blocs d'intérêt détectés, triés par score décroissant */
  blocks: InterestBlock[];
  
  /** Profil de profondeur du document */
  depthProfile: DepthProfile;
  
  /** Statistiques globales du document */
  documentStats: DocumentStats;
  
  /** Tous les mots extraits avec leurs métadonnées */
  allWords: WordNode[];
  
  /** Options utilisées pour cette analyse */
  options: AnalysisOptions;
  
  /** Durée de l'analyse en millisecondes */
  processingTimeMs: number;
}

/**
 * Statistiques globales d'un document HTML
 */
export interface DocumentStats {
  /** Nombre total de mots dans le document */
  totalWords: number;
  
  /** Nombre total de caractères */
  totalChars: number;
  
  /** Nombre de nœuds HTML dans l'arbre */
  totalNodes: number;
  
  /** Profondeur maximale de l'arbre */
  maxTreeDepth: number;
  
  /** Nombre de types de balises différentes */
  uniqueTags: number;
  
  /** Balises les plus fréquentes */
  topTags: Array<{ tag: string; count: number }>;
  
  /** Présence de balises sémantiques HTML5 */
  hasSemanticHTML: boolean;
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Type Result pour gestion d'erreurs fonctionnelle
 * Format: [Error, null] en cas d'erreur, [null, T] en cas de succès
 */
export type Result<T> = [Error, null] | [null, T];

/**
 * Point 2D pour clustering (position du mot, profondeur)
 */
export interface Point2D {
  x: number; // Position du mot (index)
  y: number; // Profondeur
  wordIndex: number; // Référence au mot original
}

/**
 * Cluster détecté par l'algorithme de clustering
 */
export interface Cluster {
  /** Identifiant du cluster */
  id: number;
  
  /** Points appartenant à ce cluster */
  points: Point2D[];
  
  /** Centre du cluster (centroid) */
  center: { x: number; y: number };
  
  /** Densité du cluster */
  density: number;
}

