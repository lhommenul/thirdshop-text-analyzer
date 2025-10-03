export type Result<T> = [Error, null] | [null, T];

export function ok<T>(value: T): Result<T> {
  return [null, value];
}

export function fail<T = never>(error: unknown): Result<T> {
  if (error instanceof Error) return [error, null];
  return [new Error(String(error)), null];
}


