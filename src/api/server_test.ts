/**
 * API Server Tests
 * 
 * Basic integration tests for the API endpoints
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const API_URL = "http://localhost:8080";

// Helper to check if server is running
async function isServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    await response.text(); // Consume body to prevent leak
    return response.ok;
  } catch {
    return false;
  }
}

Deno.test({
  name: "API Server - Health Check",
  async fn() {
    if (!await isServerRunning()) {
      console.warn("⚠️  Server not running, skipping test. Start with: deno run -A src/api/server.ts");
      return;
    }

    const response = await fetch(`${API_URL}/health`);
    assertEquals(response.status, 200);

    const data = await response.json();
    assertEquals(data.status, "healthy");
    assertExists(data.timestamp);
    assertExists(data.uptime);
    assertEquals(data.version, "1.0.0");
  },
});

Deno.test({
  name: "API Server - Metrics Endpoint",
  async fn() {
    if (!await isServerRunning()) {
      console.warn("⚠️  Server not running, skipping test");
      return;
    }

    const response = await fetch(`${API_URL}/metrics`);
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("content-type"), "text/plain; version=0.0.4");

    const text = await response.text();
    assertExists(text);
    // Should contain some metrics
    assertEquals(text.includes("# HELP"), true);
    assertEquals(text.includes("# TYPE"), true);
  },
});

Deno.test({
  name: "API Server - Analyze with JSON",
  async fn() {
    if (!await isServerRunning()) {
      console.warn("⚠️  Server not running, skipping test");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Test Product</title></head>
      <body>
        <div itemscope itemtype="http://schema.org/Product">
          <h1 itemprop="name">Test Product</h1>
          <span itemprop="price">120.00</span>
          <span itemprop="priceCurrency">EUR</span>
        </div>
      </body>
      </html>
    `;

    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: htmlContent,
        options: {
          includeEvidence: false,
        },
      }),
    });

    assertEquals(response.status, 200);
    assertExists(response.headers.get("x-trace-id"));

    const data = await response.json();
    assertEquals(data.success, true);
    assertExists(data.result);
    assertExists(data.result.classification);
    assertExists(data.metadata.traceId);
  },
});

Deno.test({
  name: "API Server - Analyze with invalid content type",
  async fn() {
    if (!await isServerRunning()) {
      console.warn("⚠️  Server not running, skipping test");
      return;
    }

    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "test",
        contentType: "application/pdf",
      }),
    });

    assertEquals(response.status, 400);

    const data = await response.json();
    assertEquals(data.success, false);
    assertExists(data.error);
    assertEquals(data.error.includes("Invalid content type"), true);
  },
});

Deno.test({
  name: "API Server - 404 Not Found",
  async fn() {
    if (!await isServerRunning()) {
      console.warn("⚠️  Server not running, skipping test");
      return;
    }

    const response = await fetch(`${API_URL}/invalid-endpoint`);
    assertEquals(response.status, 404);

    const data = await response.json();
    assertEquals(data.error, "Not Found");
    assertExists(data.availableEndpoints);
  },
});

Deno.test({
  name: "API Server - CORS Headers",
  async fn() {
    if (!await isServerRunning()) {
      console.warn("⚠️  Server not running, skipping test");
      return;
    }

    const response = await fetch(`${API_URL}/health`);
    await response.text(); // Consume body to prevent leak
    assertEquals(response.headers.get("access-control-allow-origin"), "*");
  },
});

Deno.test({
  name: "API Server - OPTIONS (CORS Preflight)",
  async fn() {
    if (!await isServerRunning()) {
      console.warn("⚠️  Server not running, skipping test");
      return;
    }

    const response = await fetch(`${API_URL}/analyze`, {
      method: "OPTIONS",
    });

    await response.body?.cancel(); // Consume body to prevent leak

    assertEquals(response.status, 204);
    assertEquals(response.headers.get("access-control-allow-origin"), "*");
    assertExists(response.headers.get("access-control-allow-methods"));
  },
});
