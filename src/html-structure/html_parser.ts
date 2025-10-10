/**
 * Module de parsing HTML et construction d'arbre de structure
 * 
 * Ce module fournit des fonctions pour parser du HTML et construire
 * une représentation structurée de l'arbre DOM.
 * 
 * @module html-structure/html_parser
 */

import { DOMParser, Document, Element, Node } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import type { Result, StructureNode } from "./types.ts";

// ============================================================================
// CONSTANTES
// ============================================================================

/** Balises HTML à ignorer par défaut lors du parsing */
const DEFAULT_IGNORED_TAGS = ["script", "style", "noscript", "iframe", "svg"];

/** Types de nœuds DOM à ignorer */
const IGNORED_NODE_TYPES = [
  Node.COMMENT_NODE,
  Node.PROCESSING_INSTRUCTION_NODE,
  Node.DOCUMENT_TYPE_NODE,
];

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Parse une chaîne HTML et retourne le document DOM
 * 
 * @param html - Chaîne HTML à parser
 * @returns Result contenant le Document parsé ou une erreur
 * 
 * @example
 * ```ts
 * const [err, doc] = parseHTML("<html><body>Hello</body></html>");
 * if (err) {
 *   console.error("Erreur de parsing:", err);
 * } else {
 *   console.log("Document parsé avec succès");
 * }
 * ```
 */
export function parseHTML(html: string): Result<Document> {
  try {
    // Validation de l'entrée
    if (!html || html.trim().length === 0) {
      return [new Error("HTML vide ou invalide"), null];
    }

    // Parser le HTML avec deno-dom
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    if (!doc) {
      return [new Error("Échec du parsing HTML"), null];
    }

    // Vérifier si le parsing a produit des erreurs
    const parserErrors = doc.querySelector("parsererror");
    if (parserErrors) {
      return [
        new Error(`Erreur de parsing HTML: ${parserErrors.textContent}`),
        null,
      ];
    }

    return [null, doc];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [
      new Error(`Exception lors du parsing HTML: ${message}`),
      null,
    ];
  }
}

/**
 * Construit un arbre de structure à partir d'un nœud DOM
 * 
 * Cette fonction parcourt récursivement l'arbre DOM et crée une représentation
 * structurée avec toutes les métadonnées nécessaires pour l'analyse.
 * 
 * @param node - Nœud DOM de départ
 * @param depth - Profondeur actuelle (0 = racine)
 * @param parent - Nœud parent dans l'arbre de structure (null si racine)
 * @param ignoredTags - Liste des balises à ignorer
 * @param pathPrefix - Préfixe du chemin DOM (pour construction récursive)
 * @returns StructureNode représentant l'arbre complet
 * 
 * @example
 * ```ts
 * const [err, doc] = parseHTML(html);
 * if (!err) {
 *   const tree = buildStructureTree(doc.documentElement);
 *   console.log(`Arbre construit avec ${countNodes(tree)} nœuds`);
 * }
 * ```
 */
export function buildStructureTree(
  node: Node,
  depth = 0,
  parent: StructureNode | null = null,
  ignoredTags: string[] = DEFAULT_IGNORED_TAGS,
  pathPrefix = "",
): StructureNode | null {
  // Ignorer les types de nœuds non pertinents
  if (IGNORED_NODE_TYPES.includes(node.nodeType)) {
    return null;
  }

  // Si c'est un nœud texte pur, on ne crée pas de StructureNode
  // (le texte sera extrait via directText)
  if (node.nodeType === Node.TEXT_NODE) {
    return null;
  }

  // Si ce n'est pas un élément, ignorer
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();

  // Ignorer les balises dans la liste d'exclusion
  if (ignoredTags.includes(tagName)) {
    return null;
  }

  // Extraire les attributs
  const attributes: Record<string, string> = {};
  if (element.attributes) {
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr) {
        attributes[attr.name] = attr.value;
      }
    }
  }

  // Construire le chemin DOM
  const domPath = buildDOMPath(pathPrefix, tagName, attributes);

  // Générer un ID unique pour ce nœud
  const nodeId = generateNodeId(domPath, depth);

  // Extraire le texte direct (sans les enfants)
  const directText = extractDirectText(element);

  // Créer le nœud de structure
  const structureNode: StructureNode = {
    tagName,
    depth,
    attributes,
    directText,
    fullText: "", // Sera calculé après l'ajout des enfants
    children: [],
    parent,
    domPath,
    nodeId,
  };

  // Parcourir récursivement les enfants
  const childNodes = Array.from(element.childNodes);
  for (const childNode of childNodes) {
    const childStructure = buildStructureTree(
      childNode,
      depth + 1,
      structureNode,
      ignoredTags,
      domPath,
    );

    if (childStructure) {
      structureNode.children.push(childStructure);
    }
  }

  // Calculer le texte complet (directText + texte de tous les enfants)
  structureNode.fullText = calculateFullText(structureNode);

  return structureNode;
}

/**
 * Extrait tous les nœuds textuels d'un arbre de structure
 * 
 * Cette fonction parcourt l'arbre et collecte tous les nœuds contenant du texte,
 * en préservant l'ordre d'apparition dans le document.
 * 
 * @param tree - Arbre de structure à parcourir
 * @returns Liste des nœuds contenant du texte
 * 
 * @example
 * ```ts
 * const tree = buildStructureTree(doc.documentElement);
 * const textNodes = extractTextNodes(tree);
 * console.log(`${textNodes.length} nœuds textuels trouvés`);
 * ```
 */
export function extractTextNodes(tree: StructureNode): StructureNode[] {
  const textNodes: StructureNode[] = [];

  function traverse(node: StructureNode) {
    // Si ce nœud contient du texte direct, l'ajouter
    if (node.directText && node.directText.trim().length > 0) {
      textNodes.push(node);
    }

    // Parcourir récursivement les enfants
    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(tree);
  return textNodes;
}

/**
 * Parse le HTML et construit directement l'arbre de structure
 * 
 * Fonction utilitaire qui combine parseHTML et buildStructureTree.
 * 
 * @param html - Chaîne HTML à parser
 * @param ignoredTags - Balises à ignorer (optionnel)
 * @returns Result contenant l'arbre de structure ou une erreur
 * 
 * @example
 * ```ts
 * const [err, tree] = parseHTMLToStructureTree(html);
 * if (!err) {
 *   console.log(`Arbre racine: ${tree.tagName}`);
 * }
 * ```
 */
export function parseHTMLToStructureTree(
  html: string,
  ignoredTags?: string[],
): Result<StructureNode> {
  // Parser le HTML
  const [parseErr, doc] = parseHTML(html);
  if (parseErr) {
    return [parseErr, null];
  }

  // Vérifier que documentElement existe
  if (!doc.documentElement) {
    return [new Error("Document HTML invalide : pas d'élément racine"), null];
  }

  // Construire l'arbre de structure
  const tree = buildStructureTree(
    doc.documentElement,
    0,
    null,
    ignoredTags || DEFAULT_IGNORED_TAGS,
  );

  if (!tree) {
    return [new Error("Impossible de construire l'arbre de structure"), null];
  }

  return [null, tree];
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Extrait le texte direct d'un élément (sans ses enfants)
 * 
 * @param element - Élément DOM
 * @returns Texte direct nettoyé
 */
function extractDirectText(element: Element): string {
  let text = "";

  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent || "";
    }
  }

  // Nettoyer les espaces blancs excessifs
  return cleanWhitespace(text);
}

/**
 * Calcule le texte complet d'un nœud (incluant tous les enfants)
 * 
 * @param node - Nœud de structure
 * @returns Texte complet
 */
function calculateFullText(node: StructureNode): string {
  let text = node.directText;

  for (const child of node.children) {
    text += " " + child.fullText;
  }

  return cleanWhitespace(text);
}

/**
 * Nettoie les espaces blancs dans une chaîne
 * 
 * - Remplace multiples espaces/tabs/newlines par un seul espace
 * - Trim les espaces en début et fin
 * 
 * @param text - Texte à nettoyer
 * @returns Texte nettoyé
 */
function cleanWhitespace(text: string): string {
  return text
    .replace(/\s+/g, " ") // Remplacer multiples espaces par un seul
    .trim(); // Supprimer espaces en début/fin
}

/**
 * Construit le chemin DOM (sélecteur CSS) pour un élément
 * 
 * @param prefix - Préfixe du chemin (chemin du parent)
 * @param tagName - Nom de la balise
 * @param attributes - Attributs de l'élément
 * @returns Chemin DOM complet
 * 
 * @example
 * buildDOMPath("html > body", "div", { class: "container" })
 * // => "html > body > div.container"
 */
function buildDOMPath(
  prefix: string,
  tagName: string,
  attributes: Record<string, string>,
): string {
  let path = prefix ? `${prefix} > ${tagName}` : tagName;

  // Ajouter l'ID si présent
  if (attributes.id) {
    path += `#${attributes.id}`;
  }

  // Ajouter les classes si présentes
  if (attributes.class) {
    const classes = attributes.class.trim().split(/\s+/);
    path += classes.map((c) => `.${c}`).join("");
  }

  return path;
}

/**
 * Génère un identifiant unique pour un nœud
 * 
 * @param domPath - Chemin DOM du nœud
 * @param depth - Profondeur du nœud
 * @returns Identifiant unique
 */
function generateNodeId(domPath: string, depth: number): string {
  // Utiliser un hash simple basé sur le chemin et la profondeur
  const hash = simpleHash(domPath);
  return `node_${depth}_${hash}`;
}

/**
 * Fonction de hash simple pour créer des identifiants
 * 
 * @param str - Chaîne à hasher
 * @returns Hash numérique
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertir en entier 32-bit
  }
  return Math.abs(hash);
}

/**
 * Compte le nombre total de nœuds dans un arbre
 * 
 * @param tree - Arbre de structure
 * @returns Nombre de nœuds
 */
export function countNodes(tree: StructureNode): number {
  let count = 1; // Compter le nœud courant

  for (const child of tree.children) {
    count += countNodes(child);
  }

  return count;
}

/**
 * Obtient la profondeur maximale d'un arbre
 * 
 * @param tree - Arbre de structure
 * @returns Profondeur maximale
 */
export function getMaxDepth(tree: StructureNode): number {
  let maxDepth = tree.depth;

  for (const child of tree.children) {
    const childMaxDepth = getMaxDepth(child);
    if (childMaxDepth > maxDepth) {
      maxDepth = childMaxDepth;
    }
  }

  return maxDepth;
}

/**
 * Trouve tous les nœuds correspondant à un prédicat
 * 
 * @param tree - Arbre à parcourir
 * @param predicate - Fonction de test
 * @returns Liste des nœuds correspondants
 * 
 * @example
 * ```ts
 * // Trouver tous les divs
 * const divs = findNodes(tree, node => node.tagName === "div");
 * 
 * // Trouver tous les nœuds avec une classe spécifique
 * const containers = findNodes(tree, node => 
 *   node.attributes.class?.includes("container")
 * );
 * ```
 */
export function findNodes(
  tree: StructureNode,
  predicate: (node: StructureNode) => boolean,
): StructureNode[] {
  const results: StructureNode[] = [];

  function traverse(node: StructureNode) {
    if (predicate(node)) {
      results.push(node);
    }

    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(tree);
  return results;
}

/**
 * Obtient les statistiques basiques d'un arbre
 * 
 * @param tree - Arbre de structure
 * @returns Objet contenant les statistiques
 */
export function getTreeStats(tree: StructureNode): {
  totalNodes: number;
  maxDepth: number;
  totalTextLength: number;
  uniqueTags: Set<string>;
} {
  const uniqueTags = new Set<string>();
  let totalNodes = 0;
  let maxDepth = 0;
  let totalTextLength = 0;

  function traverse(node: StructureNode) {
    totalNodes++;
    uniqueTags.add(node.tagName);
    totalTextLength += node.directText.length;

    if (node.depth > maxDepth) {
      maxDepth = node.depth;
    }

    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(tree);

  return {
    totalNodes,
    maxDepth,
    totalTextLength,
    uniqueTags,
  };
}

