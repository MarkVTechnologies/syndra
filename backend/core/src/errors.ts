export const ErrorCodes = [
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "ALLOCATION_EXCEEDED",
  "PAYMENT_FAILED",
  "IDEMPOTENT_REPLAY",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ErrorCodes)[number];

/** User-safe messages only — never a stack trace, never a raw DB error. PRD §7.3 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fields?: Record<string, string>;

  constructor(code: ErrorCode, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.fields = fields;
  }
}
