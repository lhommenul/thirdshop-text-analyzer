/**
 * Fonctions de normalisation HTML
 * Plusieurs stratégies disponibles selon les besoins d'analyse
 */

import { Result, ok, fail } from "../types/result.ts";
import {
  NormalizeOptions,
  NormalizationStrategy,
  NormalizedContent,
  HTML_ENTITIES,
} from "./normalize_types.ts";

const DEFAULT_OPTIONS: Required<NormalizeOptions> = {
  strategy: NormalizationStrategy.CONTENT_ONLY,
  decodeEntities: true,
  normalizeWhitespace: true,
  removeEmptyLines: true,
  preserveLineBreaks: false,
};

/**
 * Point d'entrée principal pour normaliser du HTML
 */
export function normalizeHtml(
  html: string,
  options: NormalizeOptions = {},
): Result<NormalizedContent> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    switch (opts.strategy) {
      case NormalizationStrategy.BASIC:
        return normalizeBasic(html, opts);
      case NormalizationStrategy.CONTENT_ONLY:
        return normalizeContentOnly(html, opts);
      case NormalizationStrategy.STRUCTURE_AWARE:
        return normalizeStructureAware(html, opts);
      case NormalizationStrategy.WITH_METADATA:
        return normalizeWithMetadata(html, opts);
      case NormalizationStrategy.AGGRESSIVE:
        return normalizeAggressive(html, opts);
      default:
        return fail(new Error(`Unknown strategy: ${opts.strategy}`));
    }
  } catch (error) {
    return fail(error);
  }
}

/**
 * Stratégie basique: simple suppression des balises HTML
 */
export function normalizeBasic(
  html: string,
  options: Required<NormalizeOptions>,
): Result<NormalizedContent> {
  try {
    let text = html;

    // Supprimer toutes les balises HTML
    text = text.replace(/<[^>]*>/g, " ");

    // Post-traitement
    text = postProcess(text, options);

    return ok({ text });
  } catch (error) {
    return fail(error);
  }
}

/**
 * Stratégie content-only: garde uniquement le contenu visible
 * Enlève scripts, styles, commentaires HTML
 */
export function normalizeContentOnly(
  html: string,
  options: Required<NormalizeOptions>,
): Result<NormalizedContent> {
  try {
    let text = html;

    // Supprimer les commentaires HTML
    text = text.replace(/<!--[\s\S]*?-->/g, " ");

    // Supprimer les scripts et leur contenu
    text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");

    // Supprimer les styles et leur contenu
    text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");

    // Supprimer les balises noscript
    text = text.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");

    // Supprimer les balises SVG
    text = text.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ");

    // Supprimer toutes les balises HTML restantes
    text = text.replace(/<[^>]*>/g, " ");

    // Post-traitement
    text = postProcess(text, options);

    return ok({ text });
  } catch (error) {
    return fail(error);
  }
}

/**
 * Stratégie structure-aware: préserve la structure avec espaces entre sections
 * Ajoute des sauts de ligne pour les titres, paragraphes, etc.
 */
export function normalizeStructureAware(
  html: string,
  options: Required<NormalizeOptions>,
): Result<NormalizedContent> {
  try {
    let text = html;

    // Supprimer les éléments non-contenus
    text = text.replace(/<!--[\s\S]*?-->/g, " ");
    text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
    text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
    text = text.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");
    text = text.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ");

    // Ajouter des sauts de ligne pour les éléments de bloc
    const blockElements = [
      "p", "div", "article", "section", "header", "footer", "nav", "aside",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "table", "tr", "td", "th",
      "br", "hr",
    ];

    for (const tag of blockElements) {
      // Balises ouvrantes et fermantes
      text = text.replace(
        new RegExp(`<${tag}[^>]*>`, "gi"),
        "\n",
      );
      text = text.replace(
        new RegExp(`</${tag}>`, "gi"),
        "\n",
      );
    }

    // Supprimer toutes les balises HTML restantes
    text = text.replace(/<[^>]*>/g, " ");

    // Post-traitement avec préservation des sauts de ligne
    const preserveLineBreaks = options.preserveLineBreaks;
    const modifiedOptions = { ...options, preserveLineBreaks: true };
    text = postProcess(text, modifiedOptions);

    // Réappliquer l'option originale si nécessaire
    if (!preserveLineBreaks && options.removeEmptyLines) {
      text = text.replace(/\n{3,}/g, "\n\n");
    }

    return ok({ text });
  } catch (error) {
    return fail(error);
  }
}

/**
 * Stratégie with-metadata: extrait aussi les métadonnées
 */
export function normalizeWithMetadata(
  html: string,
  options: Required<NormalizeOptions>,
): Result<NormalizedContent> {
  try {
    const metadata: NormalizedContent["metadata"] = {};

    // Extraire le titre
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    if (titleMatch) {
      metadata.title = decodeHtmlEntities(titleMatch[1].trim());
    }

    // Extraire la description
    const descMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
    );
    if (descMatch) {
      metadata.description = decodeHtmlEntities(descMatch[1]);
    }

    // Extraire les keywords
    const keywordsMatch = html.match(
      /<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i,
    );
    if (keywordsMatch) {
      metadata.keywords = keywordsMatch[1]
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }

    // Extraire la langue
    const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
    if (langMatch) {
      metadata.language = langMatch[1];
    }

    // Normaliser le contenu avec la stratégie content-only
    const contentResult = normalizeContentOnly(html, options);
    if (contentResult[0]) {
      return fail(contentResult[0]);
    }

    const content = contentResult[1];
    return ok({
      text: content.text,
      metadata,
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * Stratégie agressive: nettoyage maximal pour obtenir du texte pur
 */
export function normalizeAggressive(
  html: string,
  options: Required<NormalizeOptions>,
): Result<NormalizedContent> {
  try {
    let text = html;

    // Supprimer tout ce qui n'est pas du contenu visible
    text = text.replace(/<!--[\s\S]*?-->/g, "");
    text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
    text = text.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "");
    text = text.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "");
    text = text.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "");
    text = text.replace(/<embed\b[^>]*>/gi, "");

    // Supprimer les balises HTML
    text = text.replace(/<[^>]*>/g, " ");

    // Post-traitement
    text = postProcess(text, options);

    // Nettoyage agressif supplémentaire
    text = text.replace(/[^\p{L}\p{N}\s.,;:!?'"()€$£¥%-]/gu, " ");
    text = text.replace(/\s{2,}/g, " ");
    text = text.trim();

    return ok({ text });
  } catch (error) {
    return fail(error);
  }
}

/**
 * Post-traitement commun à toutes les stratégies
 */
function postProcess(
  text: string,
  options: Required<NormalizeOptions>,
): string {
  let result = text;

  // Décoder les entités HTML
  if (options.decodeEntities) {
    result = decodeHtmlEntities(result);
  }

  // Normaliser les espaces
  if (options.normalizeWhitespace) {
    if (options.preserveLineBreaks) {
      // Normaliser les espaces sur chaque ligne
      result = result
        .split("\n")
        .map((line) => line.replace(/[ \t]+/g, " ").trim())
        .join("\n");
    } else {
      // Tout remplacer par un seul espace
      result = result.replace(/\s+/g, " ");
    }
  }

  // Supprimer les lignes vides
  if (options.removeEmptyLines) {
    result = result
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .join("\n");
  }

  return result.trim();
}

/**
 * Décode les entités HTML courantes
 */
function decodeHtmlEntities(text: string): string {
  let result = text;

  // Remplacer les entités nommées
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    result = result.replace(new RegExp(entity, "g"), char);
  }

  // Remplacer les entités numériques décimales (&#123;)
  result = result.replace(/&#(\d+);/g, (_, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });

  // Remplacer les entités numériques hexadécimales (&#x1F;)
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return result;
}

/**
 * Helper: extrait uniquement le texte sans métadonnées
 */
export function extractText(
  html: string,
  strategy: NormalizationStrategy = NormalizationStrategy.CONTENT_ONLY,
): Result<string> {
  try {
    const result = normalizeHtml(html, { strategy });
    if (result[0]) {
      return fail(result[0]);
    }
    return ok(result[1].text);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Helper: compare plusieurs stratégies de normalisation
 */
export function compareStrategies(
  html: string,
): Result<Record<NormalizationStrategy, string>> {
  try {
    const results: Record<string, string> = {};

    for (const strategy of Object.values(NormalizationStrategy)) {
      const result = extractText(html, strategy);
      if (result[0]) {
        return fail(result[0]);
      }
      results[strategy] = result[1];
    }

    return ok(results as Record<NormalizationStrategy, string>);
  } catch (error) {
    return fail(error);
  }
}

