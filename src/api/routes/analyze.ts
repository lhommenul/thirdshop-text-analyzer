/**
 * Document Analysis Endpoint
 * 
 * Accepts HTML document upload and performs full analysis
 */

import { logger } from "../../observability/logger.ts";
import { metrics, recordAnalysis } from "../../observability/metrics.ts";
import { tracer, type Span } from "../../observability/tracer.ts";
import { analyzePage } from "../../pipeline/analyzer.ts";
import type { AnalysisResult } from "../../pipeline/analyzer_types.ts";

export interface AnalyzeRequest {
  content: string;
  contentType?: string;
  options?: {
    skipClassification?: boolean;
    includeFeatures?: boolean;
    includeEvidence?: boolean;
  };
}

export interface AnalyzeResponse {
  success: boolean;
  result?: AnalysisResult;
  error?: string;
  metadata: {
    contentType: string;
    contentLength: number;
    processingTime: number;
    traceId: string;
  };
}

export async function handleAnalyze(request: Request, parentSpan?: Span): Promise<Response> {
  const requestStart = performance.now();
  const span = tracer.startSpan("analyze_document", parentSpan?.spanId);
  
  try {
    await logger.info("Analysis request received", {
      trace_id: span.traceId,
      span_id: span.spanId,
      method: request.method,
    });

    // Parse request body
    let body: AnalyzeRequest;
    try {
      const contentType = request.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        body = await request.json();
      } else if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file");
        
        if (!file || !(file instanceof File)) {
          throw new Error("No file uploaded or invalid file");
        }

        const content = await file.text();
        body = {
          content,
          contentType: file.type || "text/html",
        };

        await logger.info("File uploaded", {
          trace_id: span.traceId,
          span_id: span.spanId,
          filename: file.name,
          size: content.length,
          type: file.type,
        });
      } else {
        // Assume raw HTML
        body = {
          content: await request.text(),
          contentType: "text/html",
        };
      }
    } catch (error) {
      await logger.error("Failed to parse request", {
        trace_id: span.traceId,
        span_id: span.spanId,
        error: error instanceof Error ? error.message : String(error),
      });

      return new Response(
        JSON.stringify({ success: false, error: "Invalid request body" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Trace-Id": span.traceId,
          },
        },
      );
    }

    // Validate content type
    const contentType = body.contentType || "text/html";
    if (!contentType.includes("html") && !contentType.includes("text")) {
      await logger.warn("Invalid content type", {
        trace_id: span.traceId,
        span_id: span.spanId,
        contentType,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid content type: ${contentType}. Only HTML documents are supported.`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Trace-Id": span.traceId,
          },
        },
      );
    }

    // Perform analysis
    const analysisSpan = tracer.startSpan("perform_analysis", span.spanId);
    tracer.setTag(analysisSpan, "content_length", body.content.length);
    tracer.setTag(analysisSpan, "content_type", contentType);

    await logger.info("Starting analysis", {
      trace_id: span.traceId,
      span_id: analysisSpan.spanId,
      content_length: body.content.length,
    });

    const [err, result] = analyzePage(body.content, body.options);

    tracer.finishSpan(analysisSpan);

    if (err) {
      await logger.error("Analysis failed", {
        trace_id: span.traceId,
        span_id: span.spanId,
        error: err.message,
      });

      const duration = performance.now() - requestStart;
      recordAnalysis(false, duration);
      tracer.setTag(span, "status", "error");
      tracer.finishSpan(span);

      return new Response(
        JSON.stringify({
          success: false,
          error: err.message,
          metadata: {
            contentType,
            contentLength: body.content.length,
            processingTime: duration,
            traceId: span.traceId,
          },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "X-Trace-Id": span.traceId,
          },
        },
      );
    }

    const duration = performance.now() - requestStart;
    recordAnalysis(true, duration);

    await logger.info("Analysis completed successfully", {
      trace_id: span.traceId,
      span_id: span.spanId,
      is_product_page: result.classification.isProductPage,
      confidence: result.classification.confidence,
      processing_time: result.processingTime,
      total_duration_ms: duration.toFixed(2),
    });

    // Record metrics
    metrics.incrementCounter("analysis_products", 1, {
      is_product: result.classification.isProductPage.toString(),
    });
    metrics.setGauge("analysis_confidence", result.classification.confidence);

    const response: AnalyzeResponse = {
      success: true,
      result,
      metadata: {
        contentType,
        contentLength: body.content.length,
        processingTime: duration,
        traceId: span.traceId,
      },
    };

    tracer.setTag(span, "status", "ok");
    tracer.setTag(span, "is_product", result.classification.isProductPage);
    tracer.finishSpan(span);

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Trace-Id": span.traceId,
      },
    });
  } catch (error) {
    await logger.error("Unexpected error in analysis endpoint", {
      trace_id: span.traceId,
      span_id: span.spanId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    const duration = performance.now() - requestStart;
    recordAnalysis(false, duration);
    tracer.setTag(span, "status", "error");
    tracer.finishSpan(span);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        metadata: {
          contentType: "unknown",
          contentLength: 0,
          processingTime: duration,
          traceId: span.traceId,
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Trace-Id": span.traceId,
        },
      },
    );
  }
}
