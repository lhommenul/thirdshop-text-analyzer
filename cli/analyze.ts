/**
 * CLI Analyzer
 * 
 * Command-line interface for analyzing HTML pages.
 * 
 * Usage:
 *   deno run -A cli/analyze.ts --file dataset/pieceoccasion-1.html
 *   deno run -A cli/analyze.ts --dir dataset/ --format csv
 */

import { parseArgs } from "jsr:@std/cli/parse-args";
import { analyzePage, analyzeDirectory } from "../src/pipeline/analyzer.ts";
import {
  formatAsJson,
  formatAsCsv,
  formatAsMarkdown,
  formatAsText,
  generateComparisonReport,
} from "../src/pipeline/formatters.ts";

interface CliOptions {
  file?: string;
  dir?: string;
  pattern?: string;
  format?: "json" | "csv" | "markdown" | "text";
  out?: string;
  pretty?: boolean;
  threshold?: number;
  includeFeatures?: boolean;
  includeEvidence?: boolean;
  tfidf?: boolean;
  topTerms?: number;
  classifyOnly?: boolean;
  extractOnly?: boolean;
  help?: boolean;
}

const HELP_TEXT = `
ThirdShop Text Analyzer - CLI Tool
==================================

Usage:
  deno run -A cli/analyze.ts [options]

Options:
  --file <path>         Analyze a single HTML file
  --dir <path>          Analyze all HTML files in directory
  --pattern <glob>      File pattern (default: "*.html")
  --format <format>     Output format: json|csv|markdown|text (default: json)
  --out <path>          Output file (default: stdout)
  --pretty              Pretty print JSON (default: true)
  --threshold <num>     Classification threshold (default: 5.0)
  --include-features    Include features in output
  --include-evidence    Include evidence in output
  --tfidf               Compute TF-IDF analysis
  --top-terms <num>     Number of top terms (default: 20)
  --classify-only       Only classify pages (faster)
  --extract-only        Only extract product data (no classification)
  --help                Show this help

Examples:
  # Analyze single file
  deno run -A cli/analyze.ts --file dataset/pieceoccasion-1.html

  # Analyze directory and export to CSV
  deno run -A cli/analyze.ts --dir dataset/ --format csv --out results.csv

  # Classification only (faster)
  deno run -A cli/analyze.ts --dir dataset/ --classify-only

  # Extract with full details
  deno run -A cli/analyze.ts --file dataset/pieceoccasion-1.html \\
    --format markdown --include-features --include-evidence
`;

async function main() {
  const args = parseArgs(Deno.args, {
    string: ["file", "dir", "pattern", "format", "out", "threshold", "topTerms"],
    boolean: [
      "pretty",
      "includeFeatures",
      "includeEvidence",
      "tfidf",
      "classifyOnly",
      "extractOnly",
      "help",
    ],
    default: {
      format: "json",
      pretty: true,
      pattern: "*.html",
      threshold: 5.0,
      topTerms: 20,
    },
    alias: {
      h: "help",
      f: "file",
      d: "dir",
      o: "out",
    },
  });

  const options: CliOptions = {
    file: args.file,
    dir: args.dir,
    pattern: args.pattern,
    format: args.format as "json" | "csv" | "markdown" | "text",
    out: args.out,
    pretty: args.pretty,
    threshold: parseFloat(args.threshold),
    includeFeatures: args.includeFeatures,
    includeEvidence: args.includeEvidence,
    tfidf: args.tfidf,
    topTerms: parseInt(args.topTerms),
    classifyOnly: args.classifyOnly,
    extractOnly: args.extractOnly,
    help: args.help,
  };

  // Show help
  if (options.help || (!options.file && !options.dir)) {
    console.log(HELP_TEXT);
    return;
  }

  const startTime = performance.now();

  try {
    // Single file analysis
    if (options.file) {
      const html = await Deno.readTextFile(options.file);
      const [err, result] = analyzePage(html, {
        includeFeatures: options.includeFeatures,
        includeEvidence: options.includeEvidence,
        computeTfidf: options.tfidf,
        topTermsCount: options.topTerms,
        skipClassification: options.extractOnly,
        classifierRules: options.threshold
          ? { threshold: options.threshold }
          : undefined,
      });

      if (err) {
        console.error("Error:", err.message);
        Deno.exit(1);
      }

      // Format output
      let output: string;
      if (options.format === "json") {
        output = formatAsJson(result, options.pretty);
      } else if (options.format === "markdown") {
        output = formatAsMarkdown(result, options.file);
      } else if (options.format === "text") {
        output = formatAsText(result);
      } else {
        // CSV doesn't make sense for single result
        output = formatAsJson(result, options.pretty);
      }

      // Write output
      if (options.out) {
        await Deno.writeTextFile(options.out, output);
        console.log(`✓ Results written to ${options.out}`);
      } else {
        console.log(output);
      }
    }

    // Directory analysis
    else if (options.dir) {
      const [err, results] = await analyzeDirectory(
        options.dir,
        options.pattern,
        {
          includeFeatures: options.includeFeatures,
          includeEvidence: options.includeEvidence,
          computeTfidf: options.tfidf,
          topTermsCount: options.topTerms,
          skipClassification: options.extractOnly,
          classifierRules: options.threshold
            ? { threshold: options.threshold }
            : undefined,
        },
      );

      if (err) {
        console.error("Error:", err.message);
        Deno.exit(1);
      }

      // Format output
      let output: string;
      if (options.format === "csv") {
        output = formatAsCsv(results);
      } else if (options.format === "text") {
        output = generateComparisonReport(results);
      } else if (options.format === "json") {
        output = JSON.stringify(
          Object.fromEntries(results),
          null,
          options.pretty ? 2 : 0,
        );
      } else if (options.format === "markdown") {
        // Generate one report per file
        const reports: string[] = [];
        for (const [id, result] of results.entries()) {
          reports.push(formatAsMarkdown(result, id));
          reports.push("\n---\n");
        }
        output = reports.join("\n");
      } else {
        output = JSON.stringify(
          Object.fromEntries(results),
          null,
          options.pretty ? 2 : 0,
        );
      }

      // Write output
      if (options.out) {
        await Deno.writeTextFile(options.out, output);
        console.log(`✓ Results written to ${options.out}`);
      } else {
        console.log(output);
      }

      // Show summary
      const totalTime = performance.now() - startTime;
      console.error("");
      console.error(`✓ Analyzed ${results.size} pages in ${totalTime.toFixed(0)}ms`);
      console.error(
        `  Average: ${(totalTime / results.size).toFixed(1)}ms per page`,
      );
    }
  } catch (error) {
    console.error("Fatal error:", error.message);
    Deno.exit(1);
  }
}

// Run CLI
if (import.meta.main) {
  main();
}
