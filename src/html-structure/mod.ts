/**
 * Module d'analyse de structure HTML
 * 
 * Ce module fournit un système complet d'analyse de structure HTML
 * basé sur la profondeur d'encapsulation des mots pour identifier
 * les zones d'intérêt dans un document.
 * 
 * @module html-structure
 * 
 * @example
 * ```ts
 * import { analyzeHTMLStructure } from "./mod.ts";
 * 
 * const html = `
 *   <html>
 *     <body>
 *       <article>
 *         <h1>Titre</h1>
 *         <p>Contenu principal...</p>
 *       </article>
 *     </body>
 *   </html>
 * `;
 * 
 * const [err, result] = await analyzeHTMLStructure(html);
 * if (!err) {
 *   console.log(`${result.blocks.length} zones d'intérêt trouvées`);
 * }
 * ```
 */

// ============================================================================
// EXPORTS PRINCIPAUX
// ============================================================================

// Fonction principale d'analyse
export {
  analyzeHTMLStructure,
  analyzeHTMLStructureSync,
  getBestBlock,
  getDepthProfile,
  quickAnalyze,
} from "./analyzer.ts";

// Fonctions de parsing
export {
  countNodes,
  extractTextNodes,
  findNodes,
  getMaxDepth,
  getTreeStats,
  parseHTML,
  parseHTMLToStructureTree,
} from "./html_parser.ts";

// Fonctions de profondeur
export {
  annotateWordsWithDepth,
  buildDepthProfile,
  calculateDepth,
  calculateDepthGradient,
  extractWords,
  getDepthDistributionStats,
  getWordsAtDepth,
  getWordsInDepthRange,
  groupWordsByDepth,
} from "./depth_calculator.ts";

// Fonctions de détection
export {
  candidateToInterestBlock,
  detectInterestBlocks,
} from "./interest_detector.ts";

// Fonctions d'analyse
export {
  calculateAggregateStats,
  classifyBlockLength,
  evaluateContentQuality,
  filterBlocks,
  generateBlockSummary,
  groupBlocksByQuality,
  rankBlocks,
  removeOverlappingBlocks,
  scoreBlock,
  selectBestBlock,
} from "./block_analyzer.ts";

// ============================================================================
// EXPORTS DE TYPES
// ============================================================================

export type {
  AnalysisOptions,
  AnalysisResult,
  BlockStats,
  Cluster,
  DepthPlateau,
  DepthProfile,
  DepthTransition,
  DetectionReason,
  DocumentStats,
  InterestBlock,
  Point2D,
  Result,
  StructureNode,
  WordNode,
} from "./types.ts";

export { DEFAULT_ANALYSIS_OPTIONS, DetectionAlgorithm } from "./types.ts";

// ============================================================================
// INFORMATIONS DU MODULE
// ============================================================================

/**
 * Version du module
 */
export const VERSION = "1.0.0";

/**
 * Informations du module
 */
export const MODULE_INFO = {
  name: "html-structure-analyzer",
  version: VERSION,
  description: "Système d'analyse de structure HTML basé sur la profondeur",
  capabilities: [
    "Parsing HTML avec deno-dom",
    "Calcul de profondeur pour chaque mot",
    "4 algorithmes de détection de zones d'intérêt",
    "Scoring et ranking des blocs",
    "Statistiques complètes",
    "Support Unicode",
  ],
  algorithms: [
    "text_density: Détection par densité textuelle",
    "depth_stability: Détection par stabilité de profondeur",
    "clustering: Clustering spatial (DBSCAN)",
    "depth_transition: Détection par transitions de profondeur",
  ],
};

