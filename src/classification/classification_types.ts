/**
 * Types for page classification
 *
 * This module defines types for feature extraction, classification rules,
 * and scoring systems used to determine if a page is a product page.
 */

/**
 * Complete set of features extracted from a page
 */
export interface PageFeatures {
  /** Structural features from HTML/DOM */
  structural: StructuralFeatures;

  /** Textual features from content analysis */
  textual: TextualFeatures;

  /** Semantic features from content structure */
  semantic: SemanticFeatures;

  /** Aggregated scores */
  scores: FeatureScores;
}

/**
 * Structural features from HTML/DOM analysis
 */
export interface StructuralFeatures {
  /** Has Schema.org Product microdata */
  hasSchemaOrgProduct: boolean;

  /** Has Open Graph product metadata */
  hasOpenGraphProduct: boolean;

  /** Has JSON-LD Product structured data */
  hasJsonLdProduct: boolean;

  /** Has "Add to Cart" button */
  hasAddToCartButton: boolean;

  /** Has "Buy" button */
  hasBuyButton: boolean;

  /** Has product images (≥ 300x300px) */
  hasProductImages: boolean;

  /** Has ratings/reviews section */
  hasRatings: boolean;

  /** Has price display element */
  hasPriceDisplay: boolean;

  /** Total number of images */
  imageCount: number;

  /** Number of high-resolution images (≥ 300x300) */
  imageHighResCount: number;

  /** Link density (ratio of link text to total text) */
  linkDensity: number;

  /** Number of tables */
  tableCount: number;

  /** Number of lists (ul, ol, dl) */
  listCount: number;

  /** Number of forms */
  formCount: number;
}

/**
 * Textual features from content analysis
 */
export interface TextualFeatures {
  /** Total word count */
  wordCount: number;

  /** Digit density (ratio of digits to total characters) */
  digitDensity: number;

  /** Count of e-commerce keywords */
  ecommerceKeywordCount: number;

  /** Count of product-specific keywords */
  productKeywordCount: number;

  /** Price detected in text */
  hasPrice: boolean;

  /** Price label detected ("Prix", "Price", etc.) */
  hasPriceLabel: boolean;

  /** Reference/SKU detected */
  hasReference: boolean;

  /** Stock information detected */
  hasStock: boolean;

  /** Shipping information detected */
  hasShipping: boolean;

  /** Warranty information detected */
  hasWarranty: boolean;

  /** Top terms by TF-IDF score */
  topTermsTfidf: Array<[string, number]>;

  /** Detected language (ISO 639-1) */
  language?: string;
}

/**
 * Semantic features from content structure analysis
 */
export interface SemanticFeatures {
  /** Has specifications table */
  hasSpecTable: boolean;

  /** Has feature/characteristics list */
  hasFeatureList: boolean;

  /** Has product description section */
  hasProductDescription: boolean;

  /** Has product-style title (H1) */
  hasProductTitle: boolean;

  /** Content structure quality score (0-10) */
  contentStructureScore: number;

  /** Main content density (ratio of main content to total) */
  mainContentDensity: number;
}

/**
 * Aggregated feature scores
 */
export interface FeatureScores {
  /** Structural score (0-10) */
  structuralScore: number;

  /** Textual score (0-10) */
  textualScore: number;

  /** Semantic score (0-10) */
  semanticScore: number;

  /** Overall weighted score (0-10) */
  overallScore: number;
}

/**
 * Result of page classification
 */
export interface ClassificationResult {
  /** Is this a product page? */
  isProductPage: boolean;

  /** Confidence level (0-1) */
  confidence: number;

  /** Overall score (0-10) */
  score: number;

  /** Human-readable reasons for classification */
  reasons: string[];

  /** Features used for classification */
  features: PageFeatures;
}

/**
 * Rules for rule-based classifier
 */
export interface ClassifierRules {
  /** Weight for structural features (default: 0.5) */
  structuralWeight: number;

  /** Weight for textual features (default: 0.3) */
  textualWeight: number;

  /** Weight for semantic features (default: 0.2) */
  semanticWeight: number;

  /** Threshold for classification (0-10, default: 5.0) */
  threshold: number;
}

/**
 * Options for classification
 */
export interface ClassificationOptions {
  /** Custom classifier rules */
  rules?: Partial<ClassifierRules>;

  /** Include detailed feature breakdown */
  includeFeatures?: boolean;

  /** Include explanation/reasons */
  includeReasons?: boolean;

  /** Minimum confidence required (0-1) */
  minConfidence?: number;
}

/**
 * Detailed scoring breakdown
 */
export interface DetailedScore {
  /** Feature category */
  category: "structural" | "textual" | "semantic";

  /** Specific criterion */
  criteria: string;

  /** Score for this criterion */
  score: number;

  /** Weight of this criterion */
  weight: number;

  /** Contribution to overall score */
  contribution: number;

  /** Human-readable explanation */
  explanation: string;
}

/**
 * Complete scoring report
 */
export interface ScoringReport {
  /** Detailed scores by criterion */
  details: DetailedScore[];

  /** Total score */
  totalScore: number;

  /** Breakdown by category */
  breakdown: {
    structural: number;
    textual: number;
    semantic: number;
  };

  /** Classification result */
  result: "product" | "non_product";

  /** Confidence level */
  confidence: number;
}

/**
 * Labeled example for training/evaluation
 */
export interface LabeledExample {
  /** Unique identifier (e.g., filename) */
  id: string;

  /** HTML content */
  html?: string;

  /** Actual label (ground truth) */
  actualLabel: "product" | "non_product";

  /** Predicted label (after classification) */
  predictedLabel?: "product" | "non_product";

  /** Prediction confidence (0-1) */
  confidence?: number;

  /** Classification score (0-10) */
  score?: number;
}

/**
 * Classification metrics
 */
export interface ClassificationMetrics {
  /** Accuracy: (TP + TN) / Total */
  accuracy: number;

  /** Precision: TP / (TP + FP) */
  precision: number;

  /** Recall: TP / (TP + FN) */
  recall: number;

  /** F1 Score: 2 * (Precision * Recall) / (Precision + Recall) */
  f1Score: number;

  /** True Positives */
  truePositives: number;

  /** True Negatives */
  trueNegatives: number;

  /** False Positives */
  falsePositives: number;

  /** False Negatives */
  falseNegatives: number;

  /** Area Under Precision-Recall Curve */
  auprc?: number;

  /** Average confidence for correct predictions */
  avgConfidence?: number;
}

/**
 * Confusion matrix
 */
export interface ConfusionMatrix {
  /** 2x2 matrix [[TP, FP], [FN, TN]] */
  matrix: number[][];

  /** Labels for rows/columns */
  labels: string[];

  /** Text visualization of matrix */
  visualization: string;
}
