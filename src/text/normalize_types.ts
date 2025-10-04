/**
 * Types et interfaces pour la normalisation HTML
 */

/**
 * Stratégies de normalisation disponibles
 */
export enum NormalizationStrategy {
  /** Simple suppression des balises HTML */
  BASIC = "basic",
  /** Ne garde que le contenu visible (enlève scripts, styles, commentaires) */
  CONTENT_ONLY = "content_only",
  /** Préserve la structure avec espaces entre sections */
  STRUCTURE_AWARE = "structure_aware",
  /** Extrait aussi les métadonnées (title, description, keywords) */
  WITH_METADATA = "with_metadata",
  /** Nettoyage très aggressif pour texte pur uniquement */
  AGGRESSIVE = "aggressive",
}

/**
 * Options de normalisation HTML
 */
export interface NormalizeOptions {
  /** Stratégie de normalisation à utiliser */
  strategy?: NormalizationStrategy;
  /** Décoder les entités HTML (&nbsp;, &amp;, etc.) */
  decodeEntities?: boolean;
  /** Normaliser les espaces multiples en un seul */
  normalizeWhitespace?: boolean;
  /** Supprimer les lignes vides */
  removeEmptyLines?: boolean;
  /** Préserver les sauts de ligne */
  preserveLineBreaks?: boolean;
}

/**
 * Résultat de normalisation avec métadonnées optionnelles
 */
export interface NormalizedContent {
  /** Texte normalisé */
  text: string;
  /** Métadonnées extraites (si applicable) */
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    language?: string;
  };
}

/**
 * Entités HTML communes à décoder
 */
export const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
  "&apos;": "'",
  "&euro;": "€",
  "&copy;": "©",
  "&reg;": "®",
  "&trade;": "™",
  "&hellip;": "...",
  "&ndash;": "-",
  "&mdash;": "—",
  "&laquo;": "«",
  "&raquo;": "»",
};

