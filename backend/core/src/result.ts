import type { ErrorCode } from "./errors";

/** Uniform result type — no thrown errors cross a service boundary. PRD §7.3 */
export type Result<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: ErrorCode; message: string; fields?: Record<string, string> };
    };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T = never>(
  code: ErrorCode,
  message: string,
  fields?: Record<string, string>
): Result<T> {
  return { ok: false, error: { code, message, fields } };
}
