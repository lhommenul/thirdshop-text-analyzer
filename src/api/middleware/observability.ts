/**
 * Observability Middleware
 * 
 * Automatically instruments HTTP requests with logging, metrics, and tracing
 */

import { logger } from "../../observability/logger.ts";
import { recordRequest, recordLatency } from "../../observability/metrics.ts";
import { tracer } from "../../observability/tracer.ts";

export interface RequestContext {
  traceId: string;
  spanId: string;
  startTime: number;
}

export async function observabilityMiddleware(
  request: Request,
  handler: (request: Request, ctx: RequestContext) => Promise<Response>,
): Promise<Response> {
  const startTime = performance.now();
  
  // Create trace context
  const span = tracer.startSpan("http_request");
  tracer.setTag(span, "http.method", request.method);
  tracer.setTag(span, "http.url", request.url);

  const ctx: RequestContext = {
    traceId: span.traceId,
    spanId: span.spanId,
    startTime,
  };

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Log incoming request
  await logger.info("HTTP request received", {
    trace_id: span.traceId,
    span_id: span.spanId,
    method,
    path,
    user_agent: request.headers.get("user-agent") || "unknown",
  });

  let response: Response;
  try {
    // Execute handler
    response = await handler(request, ctx);

    // Record metrics
    const duration = performance.now() - startTime;
    recordRequest(method, path, response.status);
    recordLatency(method, path, duration);

    // Set trace tags
    tracer.setTag(span, "http.status_code", response.status);
    tracer.setTag(span, "http.response_size", response.headers.get("content-length") || "0");

    // Log response
    await logger.info("HTTP request completed", {
      trace_id: span.traceId,
      span_id: span.spanId,
      method,
      path,
      status: response.status,
      duration_ms: duration.toFixed(2),
    });

    tracer.finishSpan(span);

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Record error metrics
    recordRequest(method, path, 500);
    recordLatency(method, path, duration);

    // Set error tags
    tracer.setTag(span, "http.status_code", 500);
    tracer.setTag(span, "error", true);
    tracer.setTag(span, "error.message", error instanceof Error ? error.message : String(error));

    // Log error
    await logger.error("HTTP request failed", {
      trace_id: span.traceId,
      span_id: span.spanId,
      method,
      path,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration_ms: duration.toFixed(2),
    });

    tracer.finishSpan(span);

    // Return error response
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        traceId: span.traceId,
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

export function corsMiddleware(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Trace-Id");
  headers.set("Access-Control-Expose-Headers", "X-Trace-Id");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
