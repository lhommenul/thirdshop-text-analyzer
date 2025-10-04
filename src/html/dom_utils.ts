/**
 * DOM Utilities
 * 
 * Helper functions for DOM navigation and manipulation.
 */

import type { Result } from "../types/result.ts";
import { fail, ok } from "../types/result.ts";

// deno-lint-ignore no-explicit-any
type DOMNode = any;

/**
 * Safely query a single element
 * 
 * @param root - Root element or document to query from
 * @param selector - CSS selector
 * @returns Element or null if not found
 */
export function querySelector(
  root: DOMNode,
  selector: string,
): Result<DOMNode | null> {
  try {
    const element = root.querySelector(selector);
    return ok(element);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Safely query all matching elements
 * 
 * @param root - Root element or document to query from
 * @param selector - CSS selector
 * @returns Array of matching elements
 */
export function querySelectorAll(
  root: DOMNode,
  selector: string,
): Result<DOMNode[]> {
  try {
    const elements = Array.from(root.querySelectorAll(selector));
    return ok(elements);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Get text content from an element, with cleanup
 * 
 * @param element - Element to extract text from
 * @param trim - Whether to trim whitespace (default: true)
 * @returns Text content
 */
export function getTextContent(
  element: DOMNode | null,
  trim = true,
): string {
  if (!element) return "";
  const text = element.textContent || "";
  return trim ? text.trim() : text;
}

/**
 * Get attribute value from an element
 * 
 * @param element - Element to get attribute from
 * @param name - Attribute name
 * @returns Attribute value or undefined
 */
export function getAttribute(
  element: DOMNode | null,
  name: string,
): string | undefined {
  if (!element) return undefined;
  return element.getAttribute(name) || undefined;
}

/**
 * Check if element has a specific class
 * 
 * @param element - Element to check
 * @param className - Class name to look for
 * @returns True if element has the class
 */
export function hasClass(
  element: DOMNode | null,
  className: string,
): boolean {
  if (!element) return false;
  return element.classList.contains(className);
}

/**
 * Get all text nodes from an element (recursive)
 * 
 * @param element - Root element
 * @returns Array of text content from all text nodes
 */
export function getTextNodes(element: DOMNode): string[] {
  const textNodes: string[] = [];
  
  function traverse(node: DOMNode) {
    if (node.nodeType === 3) { // TEXT_NODE
      const text = node.textContent?.trim();
      if (text) textNodes.push(text);
    } else if (node.nodeType === 1) { // ELEMENT_NODE
      node.childNodes.forEach((child) => traverse(child));
    }
  }
  
  traverse(element);
  return textNodes;
}

/**
 * Count elements matching a selector
 * 
 * @param root - Root element or document
 * @param selector - CSS selector
 * @returns Count of matching elements
 */
export function countElements(
  root: DOMNode,
  selector: string,
): number {
  try {
    return root.querySelectorAll(selector).length;
  } catch {
    return 0;
  }
}

/**
 * Check if selector matches any elements
 * 
 * @param root - Root element or document
 * @param selector - CSS selector
 * @returns True if at least one element matches
 */
export function hasElement(
  root: DOMNode,
  selector: string,
): boolean {
  return countElements(root, selector) > 0;
}

/**
 * Get all attributes from an element as an object
 * 
 * @param element - Element to extract attributes from
 * @returns Object with attribute name-value pairs
 */
export function getAttributes(
  element: DOMNode | null,
): Record<string, string> {
  if (!element) return {};
  
  const attrs: Record<string, string> = {};
  Array.from(element.attributes).forEach((attr) => {
    attrs[attr.name] = attr.value;
  });
  
  return attrs;
}

/**
 * Find closest ancestor matching a selector
 * 
 * @param element - Starting element
 * @param selector - CSS selector
 * @returns Closest matching ancestor or null
 */
export function findClosest(
  element: DOMNode | null,
  selector: string,
): DOMNode | null {
  if (!element) return null;
  return element.closest(selector);
}

/**
 * Get inner HTML of an element
 * 
 * @param element - Element to get HTML from
 * @returns Inner HTML string
 */
export function getInnerHTML(element: DOMNode | null): string {
  if (!element) return "";
  return element.innerHTML || "";
}

/**
 * Get outer HTML of an element
 * 
 * @param element - Element to get HTML from
 * @returns Outer HTML string
 */
export function getOuterHTML(element: DOMNode | null): string {
  if (!element) return "";
  return element.outerHTML || "";
}
