/**
 * Multi-Source Fusion
 * 
 * Resolves conflicts between multiple extraction sources with advanced strategies:
 * - Priority-based selection
 * - Weighted voting
 * - Consistency checking
 * - Confidence scoring
 */

import type { Result } from "../types/result.ts";
import { ok } from "../types/result.ts";
import type { ProductInfo, ExtractionEvidence } from "./extraction_types.ts";

/**
 * Extraction source with priority
 */
export type ExtractionSource = 
  | "jsonld"      // Priority 1.0 (highest)
  | "microdata"   // Priority 0.8
  | "opengraph"   // Priority 0.6
  | "context"     // Priority 0.5
  | "semantic"    // Priority 0.5
  | "pattern";    // Priority 0.3 (lowest)

/**
 * Source priority weights
 */
export const SOURCE_WEIGHTS: Record<ExtractionSource, number> = {
  jsonld: 1.0,
  microdata: 0.8,
  opengraph: 0.6,
  context: 0.5,
  semantic: 0.5,
  pattern: 0.3,
};

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy = 
  | "priority"      // Use highest priority source
  | "confidence"    // Use highest confidence source
  | "voting"        // Weighted voting among sources
  | "first"         // Use first available source
  | "consensus";    // Require agreement between sources

/**
 * Fusion options
 */
export interface FusionOptions {
  /** Conflict resolution strategy (default: "priority") */
  strategy?: ConflictStrategy;
  
  /** Minimum confidence threshold (default: 0.3) */
  minConfidence?: number;
  
  /** Tolerance for numerical comparison (default: 0.01 = 1%) */
  tolerance?: number;
  
  /** Require consensus from N sources (default: 2 for "consensus") */
  consensusCount?: number;
}

/**
 * Fusion result with conflict resolution details
 */
export interface FusionResult<T> {
  /** Fused value */
  value: T;
  
  /** Confidence in fused value (0-1) */
  confidence: number;
  
  /** Sources that contributed to the value */
  sources: ExtractionSource[];
  
  /** Winning source (for priority/confidence strategies) */
  winningSource?: ExtractionSource;
  
  /** Whether there was a conflict */
  hadConflict: boolean;
  
  /** Conflict resolution applied */
  resolution?: string;
}

/**
 * Candidate value from a source
 */
export interface Candidate<T> {
  value: T;
  source: ExtractionSource;
  confidence: number;
}

/**
 * Check if two numbers are approximately equal (within tolerance)
 * 
 * @param a - First number
 * @param b - Second number
 * @param tolerance - Tolerance (default: 0.01 = 1%)
 * @returns True if approximately equal
 */
function approximatelyEqual(
  a: number,
  b: number,
  tolerance = 0.01,
): boolean {
  const diff = Math.abs(a - b);
  const avg = (Math.abs(a) + Math.abs(b)) / 2;
  return avg === 0 ? diff === 0 : (diff / avg) <= tolerance;
}

/**
 * Fuse values using priority strategy
 * 
 * @param candidates - Candidate values
 * @param options - Fusion options
 * @returns Fused result
 */
function fusePriority<T>(
  candidates: Candidate<T>[],
  options: FusionOptions,
): FusionResult<T> {
  const minConf = options.minConfidence ?? 0.3;
  
  // Filter by minimum confidence
  const valid = candidates.filter((c) => c.confidence >= minConf);
  
  if (valid.length === 0) {
    return {
      value: candidates[0].value,
      confidence: candidates[0].confidence,
      sources: [candidates[0].source],
      winningSource: candidates[0].source,
      hadConflict: false,
    };
  }
  
  // Sort by source weight (priority)
  valid.sort((a, b) => {
    const weightDiff = SOURCE_WEIGHTS[b.source] - SOURCE_WEIGHTS[a.source];
    if (weightDiff !== 0) return weightDiff;
    // If same priority, use confidence
    return b.confidence - a.confidence;
  });
  
  const winner = valid[0];
  const hadConflict = valid.length > 1 && valid[0].value !== valid[1].value;
  
  return {
    value: winner.value,
    confidence: winner.confidence * SOURCE_WEIGHTS[winner.source],
    sources: [winner.source],
    winningSource: winner.source,
    hadConflict,
    resolution: hadConflict ? `Selected ${winner.source} (highest priority)` : undefined,
  };
}

/**
 * Fuse values using confidence strategy
 * 
 * @param candidates - Candidate values
 * @param options - Fusion options
 * @returns Fused result
 */
function fuseConfidence<T>(
  candidates: Candidate<T>[],
  options: FusionOptions,
): FusionResult<T> {
  const minConf = options.minConfidence ?? 0.3;
  
  // Filter and sort by confidence
  const valid = candidates
    .filter((c) => c.confidence >= minConf)
    .sort((a, b) => b.confidence - a.confidence);
  
  if (valid.length === 0) {
    return {
      value: candidates[0].value,
      confidence: candidates[0].confidence,
      sources: [candidates[0].source],
      winningSource: candidates[0].source,
      hadConflict: false,
    };
  }
  
  const winner = valid[0];
  const hadConflict = valid.length > 1 && valid[0].value !== valid[1].value;
  
  return {
    value: winner.value,
    confidence: winner.confidence,
    sources: [winner.source],
    winningSource: winner.source,
    hadConflict,
    resolution: hadConflict ? `Selected ${winner.source} (highest confidence)` : undefined,
  };
}

/**
 * Fuse numerical values using weighted voting
 * 
 * @param candidates - Candidate values
 * @param options - Fusion options
 * @returns Fused result
 */
function fuseVotingNumber(
  candidates: Candidate<number>[],
  options: FusionOptions,
): FusionResult<number> {
  const minConf = options.minConfidence ?? 0.3;
  const tolerance = options.tolerance ?? 0.01;
  
  // Filter by confidence
  const valid = candidates.filter((c) => c.confidence >= minConf);
  
  if (valid.length === 0) {
    return fusePriority(candidates, options);
  }
  
  // Group similar values (within tolerance)
  const groups: Array<{
    value: number;
    weight: number;
    sources: ExtractionSource[];
    candidates: Candidate<number>[];
  }> = [];
  
  for (const candidate of valid) {
    // Find existing group with similar value
    let foundGroup = false;
    
    for (const group of groups) {
      if (approximatelyEqual(candidate.value, group.value, tolerance)) {
        group.weight += candidate.confidence * SOURCE_WEIGHTS[candidate.source];
        group.sources.push(candidate.source);
        group.candidates.push(candidate);
        foundGroup = true;
        break;
      }
    }
    
    if (!foundGroup) {
      groups.push({
        value: candidate.value,
        weight: candidate.confidence * SOURCE_WEIGHTS[candidate.source],
        sources: [candidate.source],
        candidates: [candidate],
      });
    }
  }
  
  // Select group with highest weight
  groups.sort((a, b) => b.weight - a.weight);
  const winner = groups[0];
  
  // Calculate weighted average within winning group
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const candidate of winner.candidates) {
    const weight = candidate.confidence * SOURCE_WEIGHTS[candidate.source];
    weightedSum += candidate.value * weight;
    totalWeight += weight;
  }
  
  const fusedValue = weightedSum / totalWeight;
  const confidence = totalWeight / winner.candidates.length;
  
  return {
    value: fusedValue,
    confidence: Math.min(confidence, 1.0),
    sources: winner.sources,
    hadConflict: groups.length > 1,
    resolution: groups.length > 1
      ? `Weighted average of ${winner.candidates.length} sources`
      : undefined,
  };
}

/**
 * Fuse string values using voting
 * 
 * @param candidates - Candidate values
 * @param options - Fusion options
 * @returns Fused result
 */
function fuseVotingString(
  candidates: Candidate<string>[],
  options: FusionOptions,
): FusionResult<string> {
  const minConf = options.minConfidence ?? 0.3;
  
  // Filter by confidence
  const valid = candidates.filter((c) => c.confidence >= minConf);
  
  if (valid.length === 0) {
    return fusePriority(candidates, options);
  }
  
  // Group by exact value
  const groups = new Map<string, {
    weight: number;
    sources: ExtractionSource[];
    candidates: Candidate<string>[];
  }>();
  
  for (const candidate of valid) {
    const existing = groups.get(candidate.value);
    const weight = candidate.confidence * SOURCE_WEIGHTS[candidate.source];
    
    if (existing) {
      existing.weight += weight;
      existing.sources.push(candidate.source);
      existing.candidates.push(candidate);
    } else {
      groups.set(candidate.value, {
        weight,
        sources: [candidate.source],
        candidates: [candidate],
      });
    }
  }
  
  // Find highest weight
  let maxWeight = 0;
  let winnerValue = "";
  let winnerGroup: typeof groups extends Map<string, infer V> ? V : never;
  
  for (const [value, group] of groups.entries()) {
    if (group.weight > maxWeight) {
      maxWeight = group.weight;
      winnerValue = value;
      winnerGroup = group;
    }
  }
  
  return {
    value: winnerValue,
    confidence: Math.min(maxWeight / winnerGroup.candidates.length, 1.0),
    sources: winnerGroup.sources,
    hadConflict: groups.size > 1,
    resolution: groups.size > 1
      ? `Voted by ${winnerGroup.candidates.length} sources`
      : undefined,
  };
}

/**
 * Fuse candidates
 * 
 * @param candidates - Candidate values
 * @param options - Fusion options
 * @returns Fused result
 */
export function fuseCandidates<T>(
  candidates: Candidate<T>[],
  options: FusionOptions = {},
): Result<FusionResult<T>> {
  if (candidates.length === 0) {
    return ok({
      value: null as T,
      confidence: 0,
      sources: [],
      hadConflict: false,
    });
  }
  
  if (candidates.length === 1) {
    return ok({
      value: candidates[0].value,
      confidence: candidates[0].confidence,
      sources: [candidates[0].source],
      winningSource: candidates[0].source,
      hadConflict: false,
    });
  }
  
  const strategy = options.strategy ?? "priority";
  
  switch (strategy) {
    case "priority":
      return ok(fusePriority(candidates, options));
    
    case "confidence":
      return ok(fuseConfidence(candidates, options));
    
    case "voting":
      // Check if numeric
      if (typeof candidates[0].value === "number") {
        return ok(fuseVotingNumber(candidates as Candidate<number>[], options) as FusionResult<T>);
      } else if (typeof candidates[0].value === "string") {
        return ok(fuseVotingString(candidates as Candidate<string>[], options) as FusionResult<T>);
      } else {
        // Fallback to priority
        return ok(fusePriority(candidates, options));
      }
    
    case "first":
      return ok({
        value: candidates[0].value,
        confidence: candidates[0].confidence,
        sources: [candidates[0].source],
        winningSource: candidates[0].source,
        hadConflict: false,
      });
    
    case "consensus":
      // Require agreement from multiple sources
      const consensusCount = options.consensusCount ?? 2;
      
      if (typeof candidates[0].value === "string") {
        const result = fuseVotingString(candidates as Candidate<string>[], options);
        
        if (result.sources.length >= consensusCount) {
          return ok(result as FusionResult<T>);
        }
      }
      
      // Fallback to priority if no consensus
      return ok(fusePriority(candidates, options));
    
    default:
      return ok(fusePriority(candidates, options));
  }
}

/**
 * Create evidence from fusion result
 * 
 * @param field - Field name
 * @param fusionResult - Fusion result
 * @returns Evidence
 */
export function createEvidence<T>(
  field: string,
  fusionResult: FusionResult<T>,
): ExtractionEvidence {
  return {
    field,
    value: fusionResult.value,
    source: fusionResult.winningSource || fusionResult.sources[0],
    confidence: fusionResult.confidence,
  };
}

/**
 * Merge product data from multiple sources with fusion
 * 
 * @param sources - Array of partial product data with sources
 * @param options - Fusion options
 * @returns Merged product with evidence
 */
export function mergeProductData(
  sources: Array<{
    data: Partial<ProductInfo>;
    source: ExtractionSource;
    confidence?: number;
  }>,
  options: FusionOptions = {},
): Result<{
  product: ProductInfo;
  evidence: ExtractionEvidence[];
}> {
  const product: ProductInfo = {
    extractionMethods: [],
    confidence: 0,
  };
  const evidence: ExtractionEvidence[] = [];
  
  // Collect candidates for each field
  const fieldCandidates: Map<string, Candidate<unknown>[]> = new Map();
  
  for (const { data, source, confidence = 0.8 } of sources) {
    // Add extraction method
    if (!product.extractionMethods.includes(source)) {
      product.extractionMethods.push(source);
    }
    
    // Collect candidates for each field
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) continue;
      
      if (!fieldCandidates.has(key)) {
        fieldCandidates.set(key, []);
      }
      
      fieldCandidates.get(key)!.push({
        value,
        source,
        confidence,
      });
    }
  }
  
  // Fuse each field
  for (const [field, candidates] of fieldCandidates.entries()) {
    const [err, fusionResult] = fuseCandidates(candidates, options);
    
    if (!err && fusionResult.value !== null) {
      // Set field value
      (product as Record<string, unknown>)[field] = fusionResult.value;
      
      // Add evidence
      evidence.push(createEvidence(field, fusionResult));
    }
  }
  
  // Calculate overall confidence (average of all field confidences)
  if (evidence.length > 0) {
    product.confidence = evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length;
  }
  
  return ok({ product, evidence });
}
