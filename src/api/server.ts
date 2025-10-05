/**
 * ThirdShop Text Analyzer API Server
 * 
 * HTTP API with observability integration
 */

import { logger } from "../observability/logger.ts";
import { metrics } from "../observability/metrics.ts";
import { tracer } from "../observability/tracer.ts";
import { observabilityMiddleware, corsMiddleware, type RequestContext } from "./middleware/observability.ts";
import { handleHealth } from "./routes/health.ts";
import { handleAnalyze } from "./routes/analyze.ts";

const PORT = parseInt(Deno.env.get("PORT") || "8080");
const HOST = Deno.env.get("HOST") || "0.0.0.0";

async function handler(request: Request, ctx: RequestContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Handle OPTIONS (CORS preflight)
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Trace-Id",
      },
    });
  }

  // Get span from context
  const span = tracer.getSpan(ctx.spanId);

  // Route handling
  if (path === "/health" && method === "GET") {
    return await handleHealth(span);
  }

  if (path === "/metrics" && method === "GET") {
    // Prometheus metrics endpoint
    const metricsText = metrics.export();
    return new Response(metricsText, {
      status: 200,
      headers: { "Content-Type": "text/plain; version=0.0.4" },
    });
  }

  if (path === "/analyze" && method === "POST") {
    return await handleAnalyze(request, span);
  }

  // 404 Not Found
  return new Response(
    JSON.stringify({
      error: "Not Found",
      path,
      method,
      availableEndpoints: [
        { method: "GET", path: "/health", description: "Health check" },
        { method: "GET", path: "/metrics", description: "Prometheus metrics" },
        { method: "POST", path: "/analyze", description: "Analyze HTML document" },
      ],
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function serve() {
  await logger.info("Starting ThirdShop Text Analyzer API", {
    host: HOST,
    port: PORT,
    version: "1.0.0",
  });

  // Ensure logs directory exists
  try {
    await Deno.mkdir("./observability/logs", { recursive: true });
  } catch {
    // Directory already exists
  }

  Deno.serve({
    port: PORT,
    hostname: HOST,
    onListen: async ({ hostname, port }) => {
      await logger.info("API server listening", {
        url: `http://${hostname}:${port}`,
        endpoints: [
          `http://${hostname}:${port}/health`,
          `http://${hostname}:${port}/metrics`,
          `http://${hostname}:${port}/analyze`,
        ],
      });
      console.log(`\n🚀 ThirdShop Text Analyzer API`);
      console.log(`📍 http://${hostname}:${port}`);
      console.log(`\nEndpoints:`);
      console.log(`  GET  /health   - Health check`);
      console.log(`  GET  /metrics  - Prometheus metrics`);
      console.log(`  POST /analyze  - Analyze HTML document`);
      console.log(`\nObservability:`);
      console.log(`  Logs:    ./observability/logs/app.json`);
      console.log(`  Grafana: http://localhost:3000 (if running)`);
      console.log(`\n✨ Ready to process requests!\n`);
    },
  }, async (request) => {
    const response = await observabilityMiddleware(request, handler);
    return corsMiddleware(response);
  });
}

// Run server
if (import.meta.main) {
  serve();
}
