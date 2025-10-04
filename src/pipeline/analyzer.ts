/**
 * Analysis Pipeline
 * 
 * Main pipeline that orchestrates parsing, classification, and extraction.
 */

import type { Result } from "../types/result.ts";
import { fail, ok } from "../types/result.ts";
import type { AnalysisOptions, AnalysisResult } from "./analyzer_types.ts";
import { parseHtml } from "../html/parser.ts";
import { normalizeHtml } from "../text/normalize.ts";
import { NormalizationStrategy } from "../text/normalize_types.ts";
import { extractMainContent } from "../html/content_extractor.ts";
import { extractFeatures } from "../classification/features.ts";
import { classifyFeatures } from "../classification/rule_classifier.ts";
import { DEFAULT_RULES } from "../classification/rule_classifier.ts";
import { extractProductInfo } from "../extraction/product_extractor.ts";
import { termFrequency } from "../text/tf.ts";

/**
 * Analyze a page (complete pipeline)
 * 
 * @param html - HTML string to analyze
 * @param options - Analysis options
 * @returns Complete analysis result
 * 
 * @example
 * ```ts
 * const [err, result] = analyzePage(html);
 * if (!err) {
 *   console.log("Is product:", result.classification.isProductPage);
 *   console.log("Product name:", result.productData?.name);
 *   console.log("Processing time:", result.processingTime, "ms");
 * }
 * ```
 */
export function analyzePage(
  html: string,
  options: AnalysisOptions = {},
): Result<AnalysisResult> {
  const startTime = performance.now();
  const stepsCompleted: string[] = [];
  const errors: string[] = [];

  try {
    // STEP 1: Parse HTML
    const [parseErr, parsed] = parseHtml(html);
    if (parseErr) return fail(parseErr);
    stepsCompleted.push("parsing");

    // STEP 2: Normalize HTML
    const [normErr, normalized] = normalizeHtml(html, {
      strategy: options.normalizationStrategy as NormalizationStrategy | undefined || NormalizationStrategy.WITH_METADATA,
    });
    if (normErr) {
      errors.push(`Normalization: ${normErr.message}`);
    } else {
      stepsCompleted.push("normalization");
    }

    // STEP 3: Extract main content
    let mainContent;
    const [contentErr, contentResult] = extractMainContent(parsed.document);
    if (contentErr) {
      errors.push(`Content extraction: ${contentErr.message}`);
    } else {
      mainContent = contentResult;
      stepsCompleted.push("content_extraction");
    }

    // STEP 4: Extract features
    const [featErr, features] = extractFeatures(
      html,
      normalized || undefined,
      mainContent,
      {
        includeTfidf: options.computeTfidf,
        topTermsCount: options.topTermsCount,
      },
    );
    if (featErr) return fail(featErr);
    stepsCompleted.push("features");

    // STEP 5: Classification
    let classificationResult;
    if (!options.skipClassification) {
      const rules = {
        ...DEFAULT_RULES,
        ...options.classifierRules,
      };

      const [classErr, classResult] = classifyFeatures(features, rules);
      if (classErr) return fail(classErr);
      classificationResult = classResult;
      stepsCompleted.push("classification");
    }

    // STEP 6: Product extraction (if product page or forced)
    let productData;
    let evidence;

    if (
      options.skipClassification ||
      (classificationResult && classificationResult.isProductPage)
    ) {
      const [extractErr, extracted] = extractProductInfo(
        html,
        options.extractionOptions,
      );
      if (extractErr) {
        errors.push(`Extraction: ${extractErr.message}`);
      } else {
        productData = extracted.product;
        evidence = extracted.evidence;
        stepsCompleted.push("extraction");
      }
    }

    // STEP 7: Text analysis (TF-IDF)
    let topTerms: Array<[string, number]> = [];
    if (options.computeTfidf !== false && normalized) {
      const [tfErr, tf] = termFrequency(normalized.text, { asRelative: true });
      if (!tfErr) {
        topTerms = Object.entries(tf)
          .sort((a, b) => b[1] - a[1])
          .slice(0, options.topTermsCount || 20);
        stepsCompleted.push("tfidf");
      }
    }

    // STEP 8: Assemble result
    const processingTime = performance.now() - startTime;

    const result: AnalysisResult = {
      classification: {
        isProductPage: classificationResult?.isProductPage || false,
        confidence: classificationResult?.confidence || 0,
        score: classificationResult?.score || 0,
        reasons: classificationResult?.reasons || [],
        features: options.includeFeatures ? classificationResult?.features : undefined,
      },
      productData,
      evidence: options.includeEvidence ? evidence : undefined,
      textAnalysis: {
        wordCount: normalized?.text.split(/\s+/).length || 0,
        topTerms,
        keyPhrases: [],
        language: normalized?.metadata?.language as string | undefined,
      },
      metadata: {
        title: parsed.metadata.title,
        description: parsed.metadata.description,
        keywords: parsed.metadata.keywords,
        language: parsed.metadata.language,
        canonical: parsed.metadata.canonical,
      },
      processingTime,
      stepsCompleted,
      errors: errors.length > 0 ? errors : undefined,
    };

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Analyze multiple pages in batch
 * 
 * @param pages - Array of HTML strings with IDs
 * @param options - Analysis options
 * @returns Map of results by ID
 */
export async function analyzePages(
  pages: Array<{ id: string; html: string }>,
  options: AnalysisOptions = {},
): Promise<Result<Map<string, AnalysisResult>>> {
  try {
    const results = new Map<string, AnalysisResult>();
    const concurrency = 10; // Process 10 pages at a time

    for (let i = 0; i < pages.length; i += concurrency) {
      const chunk = pages.slice(i, i + concurrency);
      const promises = chunk.map(async ({ id, html }) => {
        const [err, result] = analyzePage(html, options);
        if (!err) {
          results.set(id, result);
        }
        return { id, err, result };
      });

      await Promise.all(promises);
    }

    return ok(results);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Analyze directory of HTML files
 * 
 * @param dirpath - Directory path
 * @param pattern - File pattern (default: "*.html")
 * @param options - Analysis options
 * @returns Map of results by filename
 */
export async function analyzeDirectory(
  dirpath: string,
  pattern = "*.html",
  options: AnalysisOptions = {},
): Promise<Result<Map<string, AnalysisResult>>> {
  try {
    const results = new Map<string, AnalysisResult>();
    
    // Read all HTML files from directory
    const files: string[] = [];
    for await (const entry of Deno.readDir(dirpath)) {
      if (entry.isFile && entry.name.endsWith(".html")) {
        files.push(entry.name);
      }
    }

    // Analyze each file
    for (const filename of files) {
      const filepath = `${dirpath}/${filename}`;
      const html = await Deno.readTextFile(filepath);
      
      const [err, result] = analyzePage(html, options);
      if (!err) {
        results.set(filename, result);
      }
    }

    return ok(results);
  } catch (error) {
    return fail(error);
  }
}
