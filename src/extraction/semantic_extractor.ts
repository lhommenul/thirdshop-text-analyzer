/**
 * Semantic Extraction
 * 
 * Extracts structured data from HTML semantic elements:
 * - Tables (<table>)
 * - Definition lists (<dl>, <dt>, <dd>)
 * - Unordered/ordered lists (<ul>, <ol>, <li>)
 * 
 * Particularly useful for product specification tables and feature lists.
 */

import type { Result } from "../types/result.ts";
import { fail, ok } from "../types/result.ts";

// deno-lint-ignore no-explicit-any
type DOMNode = any;

/**
 * Extracted key-value pair from semantic element
 */
export interface SemanticPair {
  key: string;
  value: string;
  source: "table" | "dl" | "ul" | "ol";
  confidence: number;
  element?: string; // HTML element type
}

/**
 * Options for semantic extraction
 */
export interface SemanticExtractionOptions {
  /** Normalize whitespace (default: true) */
  normalizeWhitespace?: boolean;
  
  /** Case sensitive keys (default: false) */
  caseSensitiveKeys?: boolean;
  
  /** Minimum confidence threshold (default: 0.5) */
  minConfidence?: number;
  
  /** Maximum key length (default: 100) */
  maxKeyLength?: number;
  
  /** Maximum value length (default: 500) */
  maxValueLength?: number;
}

/**
 * Normalize text (trim, collapse whitespace)
 * 
 * @param text - Text to normalize
 * @returns Normalized text
 */
function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\n+/g, " ");
}

/**
 * Calculate confidence based on key-value quality
 * 
 * High confidence (0.8-1.0): Clear key-value structure
 * Medium confidence (0.5-0.8): Reasonable structure
 * Low confidence (0.3-0.5): Weak structure
 * 
 * @param key - Key text
 * @param value - Value text
 * @returns Confidence score (0-1)
 */
function calculateSemanticConfidence(key: string, value: string): number {
  let confidence = 0.5; // Base confidence
  
  // Key quality
  if (key.length > 0 && key.length <= 50) confidence += 0.1;
  if (key.includes(":")) confidence += 0.1; // "Poids:", "Weight:"
  if (/^[A-Z]/.test(key)) confidence += 0.05; // Capitalized
  
  // Value quality
  if (value.length > 0 && value.length <= 200) confidence += 0.1;
  if (/\d/.test(value)) confidence += 0.1; // Contains numbers
  if (/[€$£\d]/.test(value)) confidence += 0.05; // Contains currency/numbers
  
  // Penalties
  if (key.length > 100) confidence -= 0.2; // Too long key
  if (value.length > 500) confidence -= 0.2; // Too long value
  if (key === value) confidence -= 0.3; // Same key and value
  
  return Math.max(0, Math.min(confidence, 1.0));
}

/**
 * Extract data from HTML table
 * 
 * Supports:
 * - Horizontal tables: <tr><td>Key</td><td>Value</td></tr>
 * - Vertical tables: <tr><th>Key</th></tr><tr><td>Value</td></tr>
 * - Mixed tables with headers
 * 
 * @param tableNode - Table DOM node
 * @param options - Extraction options
 * @returns Extracted key-value pairs
 * 
 * @example
 * ```html
 * <table>
 *   <tr><td>Poids</td><td>2.5 kg</td></tr>
 *   <tr><td>Dimensions</td><td>30 x 20 x 10 cm</td></tr>
 * </table>
 * ```
 */
export function extractFromTable(
  tableNode: DOMNode,
  options: SemanticExtractionOptions = {},
): Result<SemanticPair[]> {
  try {
    const normalizeWs = options.normalizeWhitespace ?? true;
    const minConfidence = options.minConfidence ?? 0.5;
    const maxKeyLength = options.maxKeyLength ?? 100;
    const maxValueLength = options.maxValueLength ?? 500;
    
    const pairs: SemanticPair[] = [];
    
    // Get all rows
    const rows = tableNode.querySelectorAll("tr");
    
    for (const row of rows) {
      // Try horizontal: <td>Key</td><td>Value</td>
      const cells = row.querySelectorAll("td, th");
      
      if (cells.length >= 2) {
        // Assume first cell is key, rest are values (or second cell is value)
        let key = cells[0].textContent || "";
        let value = cells[1].textContent || "";
        
        if (normalizeWs) {
          key = normalizeText(key);
          value = normalizeText(value);
        }
        
        // Validate
        if (key.length === 0 || key.length > maxKeyLength) continue;
        if (value.length === 0 || value.length > maxValueLength) continue;
        
        const confidence = calculateSemanticConfidence(key, value);
        
        if (confidence < minConfidence) continue;
        
        pairs.push({
          key,
          value,
          source: "table",
          confidence,
          element: "tr > td",
        });
      }
    }
    
    return ok(pairs);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract data from definition list (<dl>)
 * 
 * Structure: <dl><dt>Key</dt><dd>Value</dd></dl>
 * 
 * @param dlNode - Definition list DOM node
 * @param options - Extraction options
 * @returns Extracted key-value pairs
 * 
 * @example
 * ```html
 * <dl>
 *   <dt>SKU</dt><dd>ABC123</dd>
 *   <dt>Marque</dt><dd>PEUGEOT</dd>
 * </dl>
 * ```
 */
export function extractFromDefinitionList(
  dlNode: DOMNode,
  options: SemanticExtractionOptions = {},
): Result<SemanticPair[]> {
  try {
    const normalizeWs = options.normalizeWhitespace ?? true;
    const minConfidence = options.minConfidence ?? 0.5;
    const maxKeyLength = options.maxKeyLength ?? 100;
    const maxValueLength = options.maxValueLength ?? 500;
    
    const pairs: SemanticPair[] = [];
    
    // Get all dt and dd elements
    const dts = dlNode.querySelectorAll("dt");
    const dds = dlNode.querySelectorAll("dd");
    
    // Match dt with dd (1:1 or 1:many)
    for (let i = 0; i < dts.length; i++) {
      let key = dts[i].textContent || "";
      
      // Find corresponding dd (next sibling or same index)
      let value = "";
      if (i < dds.length) {
        value = dds[i].textContent || "";
      }
      
      if (normalizeWs) {
        key = normalizeText(key);
        value = normalizeText(value);
      }
      
      // Validate
      if (key.length === 0 || key.length > maxKeyLength) continue;
      if (value.length === 0 || value.length > maxValueLength) continue;
      
      const confidence = calculateSemanticConfidence(key, value);
      
      if (confidence < minConfidence) continue;
      
      pairs.push({
        key,
        value,
        source: "dl",
        confidence,
        element: "dl > dt/dd",
      });
    }
    
    return ok(pairs);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract data from unordered/ordered list
 * 
 * Tries to parse "Key: Value" or "Key - Value" patterns in list items
 * 
 * @param listNode - List DOM node (<ul> or <ol>)
 * @param options - Extraction options
 * @returns Extracted key-value pairs
 * 
 * @example
 * ```html
 * <ul>
 *   <li>Poids: 2.5 kg</li>
 *   <li>Couleur: Rouge</li>
 * </ul>
 * ```
 */
export function extractFromList(
  listNode: DOMNode,
  options: SemanticExtractionOptions = {},
): Result<SemanticPair[]> {
  try {
    const normalizeWs = options.normalizeWhitespace ?? true;
    const minConfidence = options.minConfidence ?? 0.5;
    const maxKeyLength = options.maxKeyLength ?? 100;
    const maxValueLength = options.maxValueLength ?? 500;
    
    const pairs: SemanticPair[] = [];
    
    // Get all list items
    const items = listNode.querySelectorAll("li");
    
    for (const item of items) {
      let text = item.textContent || "";
      
      if (normalizeWs) {
        text = normalizeText(text);
      }
      
      // Try to split on common separators
      let key = "";
      let value = "";
      
      // Try ": " separator
      if (text.includes(":")) {
        const parts = text.split(":");
        if (parts.length >= 2) {
          key = parts[0].trim();
          value = parts.slice(1).join(":").trim();
        }
      }
      // Try " - " separator
      else if (text.includes(" - ")) {
        const parts = text.split(" - ");
        if (parts.length >= 2) {
          key = parts[0].trim();
          value = parts.slice(1).join(" - ").trim();
        }
      }
      // Try " = " separator
      else if (text.includes(" = ")) {
        const parts = text.split(" = ");
        if (parts.length >= 2) {
          key = parts[0].trim();
          value = parts.slice(1).join(" = ").trim();
        }
      }
      
      // Validate
      if (key.length === 0 || key.length > maxKeyLength) continue;
      if (value.length === 0 || value.length > maxValueLength) continue;
      
      const confidence = calculateSemanticConfidence(key, value) * 0.8; // Lower confidence for lists
      
      if (confidence < minConfidence) continue;
      
      pairs.push({
        key,
        value,
        source: listNode.tagName.toLowerCase() === "ul" ? "ul" : "ol",
        confidence,
        element: "li",
      });
    }
    
    return ok(pairs);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract all semantic data from document
 * 
 * @param document - DOM document
 * @param options - Extraction options
 * @returns All extracted semantic pairs
 */
export function extractAllSemantic(
  document: DOMNode,
  options: SemanticExtractionOptions = {},
): Result<SemanticPair[]> {
  try {
    const allPairs: SemanticPair[] = [];
    
    // Extract from all tables
    const tables = document.querySelectorAll("table");
    for (const table of tables) {
      const [err, pairs] = extractFromTable(table, options);
      if (!err) {
        allPairs.push(...pairs);
      }
    }
    
    // Extract from all definition lists
    const dls = document.querySelectorAll("dl");
    for (const dl of dls) {
      const [err, pairs] = extractFromDefinitionList(dl, options);
      if (!err) {
        allPairs.push(...pairs);
      }
    }
    
    // Extract from all unordered lists
    const uls = document.querySelectorAll("ul");
    for (const ul of uls) {
      const [err, pairs] = extractFromList(ul, options);
      if (!err) {
        allPairs.push(...pairs);
      }
    }
    
    // Extract from all ordered lists
    const ols = document.querySelectorAll("ol");
    for (const ol of ols) {
      const [err, pairs] = extractFromList(ol, options);
      if (!err) {
        allPairs.push(...pairs);
      }
    }
    
    // Sort by confidence (highest first)
    allPairs.sort((a, b) => b.confidence - a.confidence);
    
    return ok(allPairs);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Find semantic pair by key
 * 
 * @param pairs - Semantic pairs
 * @param key - Key to search for (case-insensitive by default)
 * @param caseSensitive - Case sensitive search
 * @returns First matching pair or null
 */
export function findByKey(
  pairs: SemanticPair[],
  key: string,
  caseSensitive = false,
): SemanticPair | null {
  const searchKey = caseSensitive ? key : key.toLowerCase();
  
  for (const pair of pairs) {
    const pairKey = caseSensitive ? pair.key : pair.key.toLowerCase();
    
    if (pairKey.includes(searchKey) || searchKey.includes(pairKey)) {
      return pair;
    }
  }
  
  return null;
}

/**
 * Filter semantic pairs by keywords
 * 
 * @param pairs - Semantic pairs
 * @param keywords - Keywords to match in keys
 * @param caseSensitive - Case sensitive search
 * @returns Filtered pairs
 */
export function filterByKeywords(
  pairs: SemanticPair[],
  keywords: string[],
  caseSensitive = false,
): SemanticPair[] {
  return pairs.filter((pair) => {
    const pairKey = caseSensitive ? pair.key : pair.key.toLowerCase();
    
    return keywords.some((keyword) => {
      const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
      return pairKey.includes(searchKeyword);
    });
  });
}

/**
 * Group semantic pairs by source
 * 
 * @param pairs - Semantic pairs
 * @returns Grouped pairs
 */
export function groupBySource(
  pairs: SemanticPair[],
): Record<string, SemanticPair[]> {
  const grouped: Record<string, SemanticPair[]> = {
    table: [],
    dl: [],
    ul: [],
    ol: [],
  };
  
  for (const pair of pairs) {
    grouped[pair.source].push(pair);
  }
  
  return grouped;
}
