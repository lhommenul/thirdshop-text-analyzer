/**
 * Health Check Endpoint
 * 
 * Returns API status and readiness information
 */

import { logger } from "../../observability/logger.ts";
import { metrics } from "../../observability/metrics.ts";
import type { Span } from "../../observability/tracer.ts";

export interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    api: boolean;
    filesystem: boolean;
  };
}

const startTime = Date.now();

export async function handleHealth(span?: Span): Promise<Response> {
  const requestStart = performance.now();

  try {
    await logger.info("Health check requested", {
      trace_id: span?.traceId,
      span_id: span?.spanId,
    });

    // Check filesystem access (observability logs directory)
    let filesystemOk = true;
    try {
      await Deno.stat("./observability/logs");
    } catch {
      filesystemOk = false;
    }

    const health: HealthResponse = {
      status: filesystemOk ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: "1.0.0",
      checks: {
        api: true,
        filesystem: filesystemOk,
      },
    };

    const duration = performance.now() - requestStart;
    metrics.incrementCounter("health_checks", 1, { status: health.status });
    metrics.observeHistogram("health_check_duration", duration / 1000);

    await logger.info("Health check completed", {
      trace_id: span?.traceId,
      span_id: span?.spanId,
      status: health.status,
      duration_ms: duration.toFixed(2),
    });

    return new Response(JSON.stringify(health, null, 2), {
      status: health.status === "healthy" ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
        "X-Trace-Id": span?.traceId || "",
      },
    });
  } catch (error) {
    await logger.error("Health check failed", {
      trace_id: span?.traceId,
      span_id: span?.spanId,
      error: error instanceof Error ? error.message : String(error),
    });

    return new Response(
      JSON.stringify({
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
