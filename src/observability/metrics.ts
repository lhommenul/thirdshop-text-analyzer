/**
 * Prometheus Metrics Collector
 * 
 * Exposes metrics in Prometheus text format for scraping
 */

export class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  // Counter: increment-only metric
  incrementCounter(name: string, value = 1, labels: Record<string, string> = {}): void {
    const key = this.buildKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  // Gauge: arbitrary value metric
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
  }

  // Histogram: track distributions
  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  private buildKey(name: string, labels: Record<string, string>): string {
    if (Object.keys(labels).length === 0) return name;
    const labelsStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    return `${name}{${labelsStr}}`;
  }

  // Generate Prometheus text format
  export(): string {
    const lines: string[] = [];

    // Export counters
    for (const [key, value] of this.counters.entries()) {
      const [name, labels] = this.parseKey(key);
      if (lines.filter(l => l.startsWith(`# HELP ${name}`)).length === 0) {
        lines.push(`# HELP ${name}_total Total count`);
        lines.push(`# TYPE ${name}_total counter`);
      }
      lines.push(`${name}_total${labels} ${value}`);
    }

    // Export gauges
    for (const [key, value] of this.gauges.entries()) {
      const [name, labels] = this.parseKey(key);
      if (lines.filter(l => l.startsWith(`# HELP ${name}`)).length === 0) {
        lines.push(`# HELP ${name} Current value`);
        lines.push(`# TYPE ${name} gauge`);
      }
      lines.push(`${name}${labels} ${value}`);
    }

    // Export histograms (simplified as summaries)
    for (const [key, values] of this.histograms.entries()) {
      const [name, labels] = this.parseKey(key);
      if (lines.filter(l => l.startsWith(`# HELP ${name}`)).length === 0) {
        lines.push(`# HELP ${name}_seconds Distribution of values`);
        lines.push(`# TYPE ${name}_seconds histogram`);
      }
      
      const sorted = values.sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;

      // Histogram buckets
      const buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
      for (const bucket of buckets) {
        const countInBucket = values.filter(v => v <= bucket).length;
        lines.push(`${name}_seconds_bucket${this.addLabel(labels, "le", bucket.toString())} ${countInBucket}`);
      }
      lines.push(`${name}_seconds_bucket${this.addLabel(labels, "le", "+Inf")} ${count}`);
      lines.push(`${name}_seconds_sum${labels} ${sum}`);
      lines.push(`${name}_seconds_count${labels} ${count}`);
    }

    return lines.join("\n") + "\n";
  }

  private parseKey(key: string): [string, string] {
    const match = key.match(/^([^{]+)(\{.*\})?$/);
    if (!match) return [key, ""];
    return [match[1], match[2] || ""];
  }

  private addLabel(existingLabels: string, key: string, value: string): string {
    if (!existingLabels) return `{${key}="${value}"}`;
    const labels = existingLabels.slice(1, -1); // Remove { }
    return `{${labels},${key}="${value}"}`;
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

// Global metrics instance
export const metrics = new MetricsCollector();

// Convenience functions for common API metrics
export function recordRequest(method: string, path: string, status: number): void {
  metrics.incrementCounter("http_requests", 1, { method, path, status: status.toString() });
}

export function recordLatency(method: string, path: string, duration: number): void {
  metrics.observeHistogram("http_request_duration", duration / 1000, { method, path });
}

export function recordAnalysis(success: boolean, duration: number): void {
  metrics.incrementCounter("analysis_requests", 1, { success: success.toString() });
  metrics.observeHistogram("analysis_duration", duration / 1000);
}
