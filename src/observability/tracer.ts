/**
 * Simple Tracing Implementation
 * 
 * Provides trace/span IDs for correlation between logs, metrics, and traces.
 * For production, consider using OpenTelemetry SDK.
 */

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  tags: Record<string, string | number | boolean>;
  logs: Array<{ timestamp: number; message: string; fields?: Record<string, unknown> }>;
}

export class Tracer {
  private spans: Map<string, Span> = new Map();
  private endpoint: string;

  constructor(endpoint = "http://localhost:4318/v1/traces") {
    this.endpoint = endpoint;
  }

  // Generate trace ID (128-bit hex)
  generateTraceId(): string {
    const hex = () => Math.random().toString(16).substring(2, 18);
    return hex() + hex();
  }

  // Generate span ID (64-bit hex)
  generateSpanId(): string {
    return Math.random().toString(16).substring(2, 18);
  }

  // Start a new span
  startSpan(operationName: string, parentSpanId?: string): Span {
    const traceId = parentSpanId 
      ? Array.from(this.spans.values()).find(s => s.spanId === parentSpanId)?.traceId 
      : this.generateTraceId();
    
    const span: Span = {
      traceId: traceId || this.generateTraceId(),
      spanId: this.generateSpanId(),
      parentSpanId,
      operationName,
      startTime: Date.now(),
      tags: {},
      logs: [],
    };

    this.spans.set(span.spanId, span);
    return span;
  }

  // Add tag to span
  setTag(span: Span, key: string, value: string | number | boolean): void {
    span.tags[key] = value;
  }

  // Add log to span
  addLog(span: Span, message: string, fields?: Record<string, unknown>): void {
    span.logs.push({
      timestamp: Date.now(),
      message,
      fields,
    });
  }

  // End span
  finishSpan(span: Span): void {
    span.endTime = Date.now();
    // In production, send to Tempo via OTLP
    // For now, just log it
    if (Deno.env.get("ENABLE_TRACING") === "true") {
      this.sendToTempo(span);
    }
  }

  // Send span to Tempo (simplified)
  private async sendToTempo(span: Span): Promise<void> {
    try {
      // This is a simplified version
      // For production, use proper OTLP format and batching
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceSpans: [{
            resource: {
              attributes: [
                { key: "service.name", value: { stringValue: "thirdshop-text-analyzer" } },
              ],
            },
            scopeSpans: [{
              spans: [{
                traceId: span.traceId,
                spanId: span.spanId,
                parentSpanId: span.parentSpanId,
                name: span.operationName,
                startTimeUnixNano: span.startTime * 1000000,
                endTimeUnixNano: (span.endTime || span.startTime) * 1000000,
                attributes: Object.entries(span.tags).map(([key, value]) => ({
                  key,
                  value: { stringValue: String(value) },
                })),
              }],
            }],
          }],
        }),
      });

      if (!response.ok) {
        console.warn("Failed to send trace to Tempo:", response.statusText);
      }
    } catch (error) {
      console.warn("Failed to send trace to Tempo:", error);
    }
  }

  // Get span by ID
  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }
}

// Global tracer instance
export const tracer = new Tracer();

// Convenience function to trace an async operation
export async function traced<T>(
  operationName: string,
  fn: (span: Span) => Promise<T>,
  parentSpanId?: string,
): Promise<T> {
  const span = tracer.startSpan(operationName, parentSpanId);
  try {
    const result = await fn(span);
    tracer.setTag(span, "status", "ok");
    return result;
  } catch (error) {
    tracer.setTag(span, "status", "error");
    tracer.setTag(span, "error.message", error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    tracer.finishSpan(span);
  }
}
