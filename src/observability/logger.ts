/**
 * Structured Logger for Observability
 * 
 * Logs are written to observability/logs/ in JSON format
 * for automatic collection by Promtail -> Loki
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  trace_id?: string;
  span_id?: string;
  service: string;
  [key: string]: unknown;
}

export class Logger {
  private service: string;
  private logFile: string;

  constructor(service = "thirdshop-text-analyzer") {
    this.service = service;
    this.logFile = "./observability/logs/app.json";
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    try {
      // Write to console for development
      console.log(JSON.stringify(entry));

      // Write to log file for Promtail collection
      await Deno.writeTextFile(
        this.logFile,
        JSON.stringify(entry) + "\n",
        { append: true, create: true },
      );
    } catch (error) {
      console.error("Failed to write log:", error);
    }
  }

  async log(
    level: LogLevel,
    message: string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      ...metadata,
    };

    await this.writeLog(entry);
  }

  async debug(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log(LogLevel.DEBUG, message, metadata);
  }

  async info(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log(LogLevel.INFO, message, metadata);
  }

  async warn(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log(LogLevel.WARN, message, metadata);
  }

  async error(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log(LogLevel.ERROR, message, metadata);
  }

  // Add trace context to logs
  withTrace(traceId: string, spanId: string) {
    return {
      debug: (msg: string, meta?: Record<string, unknown>) =>
        this.debug(msg, { ...meta, trace_id: traceId, span_id: spanId }),
      info: (msg: string, meta?: Record<string, unknown>) =>
        this.info(msg, { ...meta, trace_id: traceId, span_id: spanId }),
      warn: (msg: string, meta?: Record<string, unknown>) =>
        this.warn(msg, { ...meta, trace_id: traceId, span_id: spanId }),
      error: (msg: string, meta?: Record<string, unknown>) =>
        this.error(msg, { ...meta, trace_id: traceId, span_id: spanId }),
    };
  }
}

// Global logger instance
export const logger = new Logger();
