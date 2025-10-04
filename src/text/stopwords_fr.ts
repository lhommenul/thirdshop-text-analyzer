/**
 * French Stopwords
 * 
 * List of common French words to filter out during text analysis.
 * Based on standard French stopword lists.
 */

/**
 * Common French stopwords (articles, prepositions, conjunctions, etc.)
 */
export const FRENCH_STOPWORDS = new Set<string>([
  // Articles
  "le", "la", "les", "un", "une", "des", "du", "de", "l", "d",
  
  // Pronouns
  "je", "tu", "il", "elle", "nous", "vous", "ils", "elles",
  "me", "te", "se", "lui", "leur", "moi", "toi", "soi",
  "ce", "ceci", "cela", "ça", "celui", "celle", "ceux", "celles",
  "qui", "que", "quoi", "dont", "où", "quel", "quelle", "quels", "quelles",
  
  // Prepositions
  "à", "au", "aux", "avec", "dans", "de", "depuis", "en", "entre", "par",
  "pour", "sans", "sous", "sur", "vers", "chez", "contre", "devant", "derrière",
  
  // Conjunctions
  "et", "ou", "mais", "donc", "or", "ni", "car", "comme", "si", "quand",
  "lorsque", "puisque", "que", "parce",
  
  // Common verbs (être, avoir)
  "être", "est", "es", "suis", "sommes", "êtes", "sont", "était", "étais",
  "étions", "étiez", "étaient", "sera", "seras", "serons", "serez", "seront",
  "été", "étant",
  "avoir", "ai", "as", "a", "avons", "avez", "ont", "avait", "avais",
  "avions", "aviez", "avaient", "aura", "auras", "aurons", "aurez", "auront",
  "eu", "ayant",
  
  // Auxiliary verbs (faire, aller)
  "faire", "fait", "fais", "faisons", "faites", "font", "faisait",
  "aller", "va", "vas", "allons", "allez", "vont", "allait",
  
  // Common adjectives/adverbs
  "tout", "toute", "tous", "toutes", "même", "mêmes",
  "autre", "autres", "tel", "telle", "tels", "telles",
  "très", "plus", "moins", "aussi", "bien", "mal", "peu", "beaucoup",
  "trop", "assez", "encore", "déjà", "toujours", "jamais", "souvent",
  "parfois", "alors", "ainsi", "aussi", "donc", "ensuite", "puis",
  
  // Determiners
  "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses",
  "notre", "nos", "votre", "vos", "leur", "leurs",
  "ce", "cet", "cette", "ces",
  "quel", "quelle", "quels", "quelles",
  "quelque", "quelques", "chaque", "plusieurs", "certain", "certains", "certaine", "certaines",
  
  // Numbers (basic)
  "un", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  
  // Negation
  "ne", "pas", "non", "ni", "aucun", "aucune", "nul", "nulle", "personne", "rien",
  
  // Question words
  "comment", "pourquoi", "combien", "quand", "où",
  
  // Other common words
  "oui", "non", "voici", "voilà", "ci", "là",
  "y", "en", "on", "cela", "ça",
]);

/**
 * English stopwords (for multilingual support)
 */
export const ENGLISH_STOPWORDS = new Set<string>([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
  "to", "was", "will", "with", "this", "but", "they", "have", "had",
  "what", "when", "where", "who", "which", "why", "how", "or", "not",
  "so", "can", "could", "would", "should", "may", "might", "must",
  "shall", "do", "does", "did", "been", "being", "am", "were",
]);

/**
 * Combined stopwords (French + English)
 */
export const ALL_STOPWORDS = new Set<string>([
  ...FRENCH_STOPWORDS,
  ...ENGLISH_STOPWORDS,
]);

/**
 * Check if a word is a stopword
 * 
 * @param word - Word to check
 * @param language - Language ('fr', 'en', 'all')
 * @returns True if word is a stopword
 * 
 * @example
 * ```ts
 * isStopword("le", "fr"); // true
 * isStopword("produit", "fr"); // false
 * isStopword("the", "en"); // true
 * ```
 */
export function isStopword(
  word: string,
  language: "fr" | "en" | "all" = "fr",
): boolean {
  const lowerWord = word.toLowerCase();
  
  switch (language) {
    case "fr":
      return FRENCH_STOPWORDS.has(lowerWord);
    case "en":
      return ENGLISH_STOPWORDS.has(lowerWord);
    case "all":
      return ALL_STOPWORDS.has(lowerWord);
    default:
      return FRENCH_STOPWORDS.has(lowerWord);
  }
}

/**
 * Filter stopwords from an array of words
 * 
 * @param words - Array of words
 * @param language - Language to filter
 * @returns Array without stopwords
 * 
 * @example
 * ```ts
 * const words = ["le", "produit", "est", "disponible"];
 * const filtered = filterStopwords(words, "fr");
 * // filtered = ["produit", "disponible"]
 * ```
 */
export function filterStopwords(
  words: string[],
  language: "fr" | "en" | "all" = "fr",
): string[] {
  return words.filter((word) => !isStopword(word, language));
}

/**
 * Count stopwords in an array of words
 * 
 * @param words - Array of words
 * @param language - Language to count
 * @returns Number of stopwords
 */
export function countStopwords(
  words: string[],
  language: "fr" | "en" | "all" = "fr",
): number {
  return words.filter((word) => isStopword(word, language)).length;
}

/**
 * Calculate stopword density (ratio of stopwords to total words)
 * 
 * @param words - Array of words
 * @param language - Language to count
 * @returns Stopword density (0-1)
 */
export function stopwordDensity(
  words: string[],
  language: "fr" | "en" | "all" = "fr",
): number {
  if (words.length === 0) return 0;
  return countStopwords(words, language) / words.length;
}
