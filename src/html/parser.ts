/**
 * HTML Parser - linkedom wrapper
 * 
 * This module provides a robust wrapper around linkedom for parsing HTML
 * and extracting structured data (JSON-LD, microdata, Open Graph).
 */

import { parseHTML } from "linkedom";
import type { Result } from "../types/result.ts";
import { fail, ok } from "../types/result.ts";
import type {
  JsonLdData,
  MicrodataItem,
  PageMetadata,
  ParsedDocument,
  ParseOptions,
} from "./parser_types.ts";

// linkedom types (use any for DOM compatibility)
// deno-lint-ignore no-explicit-any
type DOMDocument = any;
// deno-lint-ignore no-explicit-any
type DOMElement = any;

/**
 * Parse HTML string into a structured document
 * 
 * @param html - HTML string to parse
 * @param options - Parsing options
 * @returns ParsedDocument with DOM and extracted metadata
 * 
 * @example
 * ```ts
 * const [err, parsed] = parseHtml("<html><body><h1>Hello</h1></body></html>");
 * if (!err) {
 *   console.log(parsed.metadata.title);
 * }
 * ```
 */
export function parseHtml(
  html: string,
  options: ParseOptions = {},
): Result<ParsedDocument> {
  try {
    if (!html || typeof html !== "string") {
      return fail(new Error("Invalid HTML input: must be a non-empty string"));
    }

    // Parse HTML with linkedom
    const { document } = parseHTML(html);

    // Apply options
    if (options.removeScripts !== false) {
      document.querySelectorAll("script").forEach((el: DOMElement) => el.remove());
    }
    if (options.removeStyles !== false) {
      document.querySelectorAll("style").forEach((el: DOMElement) => el.remove());
    }
    if (options.removeComments) {
      // Comments are already handled by linkedom
    }

    // Extract structured data
    const [jsonLdErr, jsonLd] = extractJsonLd(document);
    const [microdataErr, microdata] = extractMicrodata(document);
    const [ogErr, openGraph] = extractOpenGraph(document);
    const [metaErr, metadata] = extractPageMetadata(document);

    // Build result (non-fatal errors for structured data)
    const result: ParsedDocument = {
      document: document as unknown as ParsedDocument["document"],
      jsonLd: jsonLdErr ? [] : jsonLd,
      microdata: microdataErr ? [] : microdata,
      openGraph: ogErr ? {} : openGraph,
      metadata: metaErr ? {} : metadata,
    };

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract JSON-LD structured data from document
 * 
 * @param document - DOM document
 * @returns Array of JSON-LD data objects
 */
export function extractJsonLd(document: DOMDocument): Result<JsonLdData[]> {
  try {
    const jsonLdData: JsonLdData[] = [];
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]',
    );

    scripts.forEach((script: DOMElement) => {
      try {
        const content = script.textContent?.trim();
        if (!content) return;

        const data = JSON.parse(content);
        
        // Handle both single objects and arrays
        const dataArray = Array.isArray(data) ? data : [data];
        
        for (const item of dataArray) {
          const type = item["@type"];
          jsonLdData.push({
            type: type,
            data: item,
            confidence: 1.0, // JSON-LD is always high confidence
          });
        }
      } catch (parseError) {
        // Skip invalid JSON-LD
        console.warn("Failed to parse JSON-LD:", parseError);
      }
    });

    return ok(jsonLdData);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract Schema.org microdata from document
 * 
 * @param document - DOM document
 * @returns Array of microdata items
 */
export function extractMicrodata(
  document: DOMDocument,
): Result<MicrodataItem[]> {
  try {
    const microdataItems: MicrodataItem[] = [];
    const itemScopes = document.querySelectorAll("[itemscope]");

    itemScopes.forEach((element: DOMElement) => {
      try {
        const itemType = element.getAttribute("itemtype") || undefined;
        const properties: Record<string, unknown> = {};

        // Extract all itemprop within this itemscope
        const props = element.querySelectorAll("[itemprop]");
        props.forEach((prop: DOMElement) => {
          const propName = prop.getAttribute("itemprop");
          if (!propName) return;

          // Get value based on element type
          let value: string | undefined;
          const tagName = prop.tagName.toLowerCase();
          
          if (tagName === "meta") {
            value = prop.getAttribute("content") || undefined;
          } else if (tagName === "link" || tagName === "a") {
            value = prop.getAttribute("href") || undefined;
          } else if (tagName === "img") {
            value = prop.getAttribute("src") || undefined;
          } else {
            value = prop.textContent?.trim() || undefined;
          }

          if (value) {
            properties[propName] = value;
          }
        });

        if (Object.keys(properties).length > 0) {
          microdataItems.push({
            type: itemType,
            properties,
            confidence: 0.9, // Microdata is very reliable
          });
        }
      } catch (itemError) {
        console.warn("Failed to parse microdata item:", itemError);
      }
    });

    return ok(microdataItems);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract Open Graph metadata from document
 * 
 * @param document - DOM document
 * @returns Open Graph properties as key-value pairs
 */
export function extractOpenGraph(
  document: DOMDocument,
): Result<Record<string, string>> {
  try {
    const openGraph: Record<string, string> = {};
    const ogMetas = document.querySelectorAll('meta[property^="og:"]');

    ogMetas.forEach((meta: DOMElement) => {
      const property = meta.getAttribute("property");
      const content = meta.getAttribute("content");
      if (property && content) {
        openGraph[property] = content;
      }
    });

    // Also check for product: properties
    const productMetas = document.querySelectorAll('meta[property^="product:"]');
    productMetas.forEach((meta: DOMElement) => {
      const property = meta.getAttribute("property");
      const content = meta.getAttribute("content");
      if (property && content) {
        openGraph[property] = content;
      }
    });

    return ok(openGraph);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Extract general page metadata
 * 
 * @param document - DOM document
 * @returns Page metadata (title, description, keywords, etc.)
 */
export function extractPageMetadata(
  document: DOMDocument,
): Result<PageMetadata> {
  try {
    const metadata: PageMetadata = {};

    // Title
    const titleElement = document.querySelector("title");
    if (titleElement) {
      metadata.title = titleElement.textContent?.trim();
    }

    // Meta description
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      metadata.description = descMeta.getAttribute("content") || undefined;
    }

    // Meta keywords
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
      const content = keywordsMeta.getAttribute("content");
      if (content) {
        metadata.keywords = content.split(",").map((k: string) => k.trim());
      }
    }

    // Language
    const htmlLang = document.documentElement.getAttribute("lang");
    if (htmlLang) {
      metadata.language = htmlLang;
    } else {
      const metaLang = document.querySelector('meta[http-equiv="content-language"]');
      if (metaLang) {
        metadata.language = metaLang.getAttribute("content") || undefined;
      }
    }

    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      metadata.canonical = canonical.getAttribute("href") || undefined;
    }

    // Robots
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) {
      metadata.robots = robotsMeta.getAttribute("content") || undefined;
    }

    // Viewport
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      metadata.viewport = viewportMeta.getAttribute("content") || undefined;
    }

    // Charset
    const charsetMeta = document.querySelector("meta[charset]");
    if (charsetMeta) {
      metadata.charset = charsetMeta.getAttribute("charset") || undefined;
    } else {
      const charsetMetaAlt = document.querySelector('meta[http-equiv="Content-Type"]');
      if (charsetMetaAlt) {
        const content = charsetMetaAlt.getAttribute("content");
        const match = content?.match(/charset=([^;]+)/);
        if (match) {
          metadata.charset = match[1].trim();
        }
      }
    }

    return ok(metadata);
  } catch (error) {
    return fail(error);
  }
}
