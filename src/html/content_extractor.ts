/**
 * Content Extractor
 * 
 * Extracts main content from HTML documents by analyzing text density,
 * link density, and removing navigation/boilerplate elements.
 */

import type { Result } from "../types/result.ts";
import { fail, ok } from "../types/result.ts";

// deno-lint-ignore no-explicit-any
type DOMDocument = any;
// deno-lint-ignore no-explicit-any
type DOMNode = any;

/**
 * Options for content extraction
 */
export interface ContentExtractionOptions {
  /** Remove navigation elements (default: true) */
  removeNav?: boolean;
  
  /** Remove header elements (default: true) */
  removeHeader?: boolean;
  
  /** Remove footer elements (default: true) */
  removeFoot?: boolean;
  
  /** Remove sidebar elements (default: true) */
  removeSidebar?: boolean;
  
  /** Minimum text density threshold (default: 0.3) */
  minTextDensity?: number;
  
  /** Maximum link density threshold (default: 0.5) */
  maxLinkDensity?: number;
}

/**
 * Result of content extraction
 */
export interface ExtractedContent {
  /** Main content text */
  mainContent: string;
  
  /** Main content DOM node */
  mainContentNode: DOMNode | null;
  
  /** Content density score (0-1) */
  contentDensity: number;
  
  /** Link density in main content (0-1) */
  linkDensity: number;
  
  /** Total word count in main content */
  wordCount: number;
  
  /** Total character count */
  charCount: number;
  
  /** Number of paragraphs */
  paragraphCount: number;
  
  /** Types of removed nodes */
  removedNodes: string[];
}

/**
 * Extract main content from HTML document
 * 
 * @param document - Parsed HTML document
 * @param options - Extraction options
 * @returns Extracted content with metadata
 * 
 * @example
 * ```ts
 * const [err, content] = extractMainContent(document);
 * if (!err) {
 *   console.log("Main content:", content.mainContent);
 *   console.log("Content density:", content.contentDensity);
 * }
 * ```
 */
export function extractMainContent(
  document: DOMDocument,
  options: ContentExtractionOptions = {},
): Result<ExtractedContent> {
  try {
    const opts = {
      removeNav: options.removeNav !== false,
      removeHeader: options.removeHeader !== false,
      removeFoot: options.removeFoot !== false,
      removeSidebar: options.removeSidebar !== false,
      minTextDensity: options.minTextDensity ?? 0.3,
      maxLinkDensity: options.maxLinkDensity ?? 0.5,
    };

    const removedNodes: string[] = [];

    // Clone document to avoid modifying original
    const body = document.querySelector("body");
    if (!body) {
      return fail(new Error("No body element found"));
    }

    // Remove boilerplate elements
    if (opts.removeNav) {
      const navElements = body.querySelectorAll("nav, [role='navigation']");
      navElements.forEach((el: DOMNode) => {
        el.remove();
        removedNodes.push("nav");
      });
    }

    if (opts.removeHeader) {
      const headerElements = body.querySelectorAll("header, [role='banner']");
      headerElements.forEach((el: DOMNode) => {
        el.remove();
        removedNodes.push("header");
      });
    }

    if (opts.removeFoot) {
      const footerElements = body.querySelectorAll("footer, [role='contentinfo']");
      footerElements.forEach((el: DOMNode) => {
        el.remove();
        removedNodes.push("footer");
      });
    }

    if (opts.removeSidebar) {
      const sidebarElements = body.querySelectorAll("aside, [role='complementary']");
      sidebarElements.forEach((el: DOMNode) => {
        el.remove();
        removedNodes.push("aside");
      });
    }

    // Also remove common boilerplate classes/ids
    const boilerplateSelectors = [
      ".menu", ".nav", ".navigation", ".sidebar", ".footer", ".header",
      "#menu", "#nav", "#navigation", "#sidebar", "#footer", "#header",
      ".advertisement", ".ads", ".ad", ".banner",
    ];

    for (const selector of boilerplateSelectors) {
      try {
        const elements = body.querySelectorAll(selector);
        elements.forEach((el: DOMNode) => {
          el.remove();
          removedNodes.push(selector);
        });
      } catch {
        // Selector might not be valid, skip
      }
    }

    // Find main content node by analyzing text density
    const mainContentNode = findMainContentNode(body, opts);
    
    // Extract text from main content
    const mainContent = mainContentNode
      ? extractTextFromNode(mainContentNode)
      : extractTextFromNode(body);

    // Calculate metrics
    const wordCount = countWords(mainContent);
    const charCount = mainContent.length;
    const paragraphCount = countParagraphs(mainContentNode || body);
    const contentDensity = calculateContentDensity(mainContentNode || body);
    const linkDensity = calculateLinkDensity(mainContentNode || body);

    return ok({
      mainContent,
      mainContentNode,
      contentDensity,
      linkDensity,
      wordCount,
      charCount,
      paragraphCount,
      removedNodes,
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * Find the main content node by analyzing text density
 * 
 * @param root - Root node to analyze
 * @param options - Extraction options
 * @returns Main content node or null
 */
function findMainContentNode(
  root: DOMNode,
  options: ContentExtractionOptions,
): DOMNode | null {
  // Try to find main content by common selectors
  const mainSelectors = [
    "main",
    "[role='main']",
    "article",
    ".main-content",
    "#main-content",
    ".content",
    "#content",
    ".product-content",
    ".product-info",
  ];

  for (const selector of mainSelectors) {
    try {
      const element = root.querySelector(selector);
      if (element) {
        const density = calculateContentDensity(element);
        if (density >= (options.minTextDensity ?? 0.3)) {
          return element;
        }
      }
    } catch {
      // Selector might not be valid, skip
    }
  }

  // If no main content found by selectors, analyze all divs
  const divs = root.querySelectorAll("div");
  let bestNode: DOMNode | null = null;
  let bestScore = 0;

  divs.forEach((div: DOMNode) => {
    const density = calculateContentDensity(div);
    const linkDensity = calculateLinkDensity(div);
    const wordCount = countWords(extractTextFromNode(div));

    // Score based on text density, low link density, and word count
    const score = density * (1 - linkDensity) * Math.min(wordCount / 100, 1);

    if (score > bestScore) {
      bestScore = score;
      bestNode = div;
    }
  });

  return bestNode;
}

/**
 * Calculate content density (ratio of text to total content)
 * 
 * @param node - DOM node to analyze
 * @returns Content density (0-1)
 */
export function calculateContentDensity(node: DOMNode): number {
  if (!node) return 0;

  const text = extractTextFromNode(node).trim();
  const html = node.innerHTML || "";

  if (html.length === 0) return 0;

  // Calculate ratio of text to HTML
  const textLength = text.length;
  const htmlLength = html.length;

  return Math.min(textLength / htmlLength, 1);
}

/**
 * Calculate link density (ratio of link text to total text)
 * 
 * @param node - DOM node to analyze
 * @returns Link density (0-1)
 */
export function calculateLinkDensity(node: DOMNode): number {
  if (!node) return 0;

  const totalText = extractTextFromNode(node).trim();
  const links = node.querySelectorAll("a");

  let linkTextLength = 0;
  links.forEach((link: DOMNode) => {
    linkTextLength += (link.textContent || "").trim().length;
  });

  if (totalText.length === 0) return 0;

  return Math.min(linkTextLength / totalText.length, 1);
}

/**
 * Extract text from a DOM node
 * 
 * @param node - DOM node
 * @returns Extracted text
 */
function extractTextFromNode(node: DOMNode): string {
  if (!node) return "";
  return (node.textContent || "").trim();
}

/**
 * Count words in text
 * 
 * @param text - Text to count
 * @returns Word count
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Count paragraphs in a node
 * 
 * @param node - DOM node
 * @returns Paragraph count
 */
function countParagraphs(node: DOMNode): number {
  if (!node) return 0;
  const paragraphs = node.querySelectorAll("p");
  return paragraphs.length;
}

/**
 * Calculate main content density for the entire document
 * 
 * @param document - Parsed HTML document
 * @returns Main content to total content ratio
 */
export function calculateMainContentRatio(
  document: DOMDocument,
): Result<number> {
  try {
    const body = document.querySelector("body");
    if (!body) {
      return fail(new Error("No body element found"));
    }

    const [err, extracted] = extractMainContent(document);
    if (err) return fail(err);

    const totalText = extractTextFromNode(body);
    const mainText = extracted.mainContent;

    if (totalText.length === 0) return ok(0);

    return ok(Math.min(mainText.length / totalText.length, 1));
  } catch (error) {
    return fail(error);
  }
}
