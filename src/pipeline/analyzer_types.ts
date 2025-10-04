/**
 * Types for the analysis pipeline
 *
 * This module defines types for the main analysis pipeline that orchestrates
 * parsing, feature extraction, classification, and product data extraction.
 */

import type {
  ExtractionEvidence,
  ExtractionOptions,
  ProductInfo,
} from "../extraction/extraction_types.ts";
import type {
  ClassificationResult,
  ClassifierRules,
} from "../classification/classification_types.ts";
import type { PageMetadata } from "../html/parser_types.ts";

/**
 * Options for the analysis pipeline
 */
export interface AnalysisOptions {
  // === Normalization Options ===

  /** HTML normalization strategy */
  normalizationStrategy?:
    | "BASIC"
    | "CONTENT_ONLY"
    | "STRUCTURE_AWARE"
    | "WITH_METADATA"
    | "AGGRESSIVE";

  // === Extraction Options ===

  /** Product extraction options */
  extractionOptions?: ExtractionOptions;

  // === Classification Options ===

  /** Custom classifier rules */
  classifierRules?: Partial<ClassifierRules>;

  /** Skip classification and force extraction */
  skipClassification?: boolean;

  // === Text Analysis Options ===

  /** Compute TF-IDF analysis (default: true) */
  computeTfidf?: boolean;

  /** Number of top terms to include (default: 20) */
  topTermsCount?: number;

  /** Extract key phrases */
  extractKeyPhrases?: boolean;

  // === Output Options ===

  /** Include detailed features in result */
  includeFeatures?: boolean;

  /** Include extraction evidence */
  includeEvidence?: boolean;

  /** Include detailed error messages */
  verboseErrors?: boolean;
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  /** Classification result */
  classification: ClassificationSummary;

  /** Product data (if classified as product page) */
  productData?: ProductInfo;

  /** Extraction evidence (if includeEvidence: true) */
  evidence?: ExtractionEvidence[];

  /** Text analysis results */
  textAnalysis: TextAnalysisResult;

  /** Page metadata */
  metadata: PageMetadata;

  /** Processing time in milliseconds */
  processingTime: number;

  /** Steps completed successfully */
  stepsCompleted: string[];

  /** Errors encountered (non-fatal) */
  errors?: string[];
}

/**
 * Classification summary in analysis result
 */
export interface ClassificationSummary {
  /** Is this a product page? */
  isProductPage: boolean;

  /** Confidence level (0-1) */
  confidence: number;

  /** Classification score (0-10) */
  score: number;

  /** Human-readable reasons */
  reasons: string[];

  /** Detailed features (if includeFeatures: true) */
  features?: ClassificationResult["features"];
}

/**
 * Text analysis result
 */
export interface TextAnalysisResult {
  /** Total word count */
  wordCount: number;

  /** Top terms by TF-IDF */
  topTerms: Array<[string, number]>;

  /** Extracted key phrases */
  keyPhrases: string[];

  /** Detected language */
  language?: string;

  /** Average word length */
  avgWordLength?: number;

  /** Sentence count */
  sentenceCount?: number;
}

/**
 * Batch processing options
 */
export interface BatchOptions extends AnalysisOptions {
  /** Number of concurrent analyses (default: 10) */
  concurrency?: number;

  /** Continue on error (default: true) */
  continueOnError?: boolean;

  /** Progress callback */
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Batch analysis result
 */
export interface BatchResult {
  /** Results by page ID */
  results: Map<string, AnalysisResult>;

  /** Total pages processed */
  totalProcessed: number;

  /** Pages with errors */
  errors: Map<string, Error>;

  /** Total processing time */
  totalTime: number;

  /** Summary statistics */
  summary: BatchSummary;
}

/**
 * Summary statistics for batch analysis
 */
export interface BatchSummary {
  /** Number of product pages */
  productPages: number;

  /** Number of non-product pages */
  nonProductPages: number;

  /** Average confidence */
  avgConfidence: number;

  /** Average processing time per page */
  avgProcessingTime: number;

  /** Success rate */
  successRate: number;
}

/**
 * Output format options
 */
export type OutputFormat = "json" | "csv" | "markdown" | "text";

/**
 * Export options for formatters
 */
export interface ExportOptions {
  /** Output format */
  format: OutputFormat;

  /** Pretty print (for JSON) */
  pretty?: boolean;

  /** Include header (for CSV) */
  includeHeader?: boolean;

  /** Fields to include (for CSV) */
  fields?: string[];

  /** Include evidence */
  includeEvidence?: boolean;

  /** Include features */
  includeFeatures?: boolean;
}

/**
 * Progress information
 */
export interface ProgressInfo {
  /** Number of pages completed */
  completed: number;

  /** Total number of pages */
  total: number;

  /** Current page being processed */
  current?: string;

  /** Percentage complete (0-100) */
  percentage: number;

  /** Estimated time remaining (ms) */
  estimatedTimeRemaining?: number;
}

/**
 * Pipeline step
 */
export type PipelineStep =
  | "parsing"
  | "normalization"
  | "content_extraction"
  | "features"
  | "classification"
  | "extraction"
  | "tfidf"
  | "key_phrases";

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  /** Steps to execute (if undefined, executes all) */
  steps?: PipelineStep[];

  /** Stop on first error */
  stopOnError?: boolean;

  /** Timeout per page (ms) */
  timeout?: number;

  /** Enable performance profiling */
  enableProfiling?: boolean;
}

/**
 * Performance profile for a pipeline execution
 */
export interface PerformanceProfile {
  /** Total execution time */
  totalTime: number;

  /** Time per step */
  stepTimes: Record<PipelineStep, number>;

  /** Memory usage (bytes) */
  memoryUsage?: number;

  /** Peak memory usage (bytes) */
  peakMemory?: number;
}
