/**
 * Types for HTML parsing and DOM manipulation
 * 
 * This module defines the core types for parsing HTML documents,
 * navigating the DOM tree, and extracting structured data.
 */

/**
 * Represents a node in the DOM tree
 */
export interface DOMNode {
  /** HTML tag name (e.g., 'div', 'span', 'meta') */
  tagName: string;

  /** Combined text content of this node and its children */
  textContent: string;

  /** HTML attributes as key-value pairs */
  attributes: Record<string, string>;

  /** Child nodes */
  children: DOMNode[];

  /** Parent node (undefined for root) */
  parent?: DOMNode;

  /** Raw HTML of this node (optional) */
  innerHTML?: string;

  /** Outer HTML including the element itself (optional) */
  outerHTML?: string;
}

/**
 * Options for parsing HTML documents
 */
export interface ParseOptions {
  /** Remove <script> tags and their content */
  removeScripts?: boolean;

  /** Remove <style> tags and their content */
  removeStyles?: boolean;

  /** Preserve whitespace (default: false, collapses whitespace) */
  preserveWhitespace?: boolean;

  /** Remove HTML comments */
  removeComments?: boolean;

  /** Maximum depth for DOM tree parsing (prevents deep recursion) */
  maxDepth?: number;
}

/**
 * Result of HTML parsing with extracted metadata
 */
export interface ParsedDocument {
  /** Root DOM node */
  document: DOMNode;

  /** Extracted JSON-LD scripts */
  jsonLd: JsonLdData[];

  /** Extracted microdata */
  microdata: MicrodataItem[];

  /** Extracted Open Graph metadata */
  openGraph: Record<string, string>;

  /** General page metadata */
  metadata: PageMetadata;
}

/**
 * JSON-LD structured data
 */
export interface JsonLdData {
  /** @type field (e.g., "Product", "Organization") */
  type?: string | string[];

  /** Raw JSON-LD object */
  data: Record<string, unknown>;

  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Microdata item (Schema.org microdata format)
 */
export interface MicrodataItem {
  /** itemtype attribute (e.g., "https://schema.org/Product") */
  type?: string;

  /** Extracted properties with itemprop */
  properties: Record<string, unknown>;

  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * General page metadata
 */
export interface PageMetadata {
  /** Page title */
  title?: string;

  /** Meta description */
  description?: string;

  /** Meta keywords */
  keywords?: string[];

  /** Detected or declared language (ISO 639-1) */
  language?: string;

  /** Canonical URL */
  canonical?: string;

  /** Robots meta directives */
  robots?: string;

  /** Viewport settings */
  viewport?: string;

  /** Character encoding */
  charset?: string;
}

/**
 * Options for querySelector operations
 */
export interface QueryOptions {
  /** Case-insensitive matching for attributes */
  caseInsensitive?: boolean;

  /** Maximum number of results (for querySelectorAll) */
  limit?: number;
}

/**
 * Result of a DOM query operation
 */
export interface QueryResult {
  /** Matched nodes */
  nodes: DOMNode[];

  /** Number of matches */
  count: number;

  /** Whether the query was truncated (hit limit) */
  truncated: boolean;
}
