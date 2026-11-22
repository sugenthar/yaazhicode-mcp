import { LimitExceededError, ValidationError } from '../shared/errors.js';

export function requireString(value: unknown, name: string, maxChars: number): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${name} must be a string`);
  }
  if (value.length > maxChars) {
    throw new LimitExceededError(`${name} exceeds the ${maxChars}-character limit`, { name, length: value.length });
  }
  return value;
}

export function optionalString(value: unknown, name: string, maxChars: number): string | undefined {
  if (value === undefined) return undefined;
  return requireString(value, name, maxChars);
}

export function requireEnum<T extends string>(value: unknown, name: string, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new ValidationError(`${name} must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
}

export function requireInteger(value: unknown, name: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ValidationError(`${name} must be an integer`);
  }
  if (value < min || value > max) {
    throw new ValidationError(`${name} must be between ${min} and ${max}`);
  }
  return value;
}

export function requireArray(value: unknown, name: string, maxItems: number): unknown[] {
  if (!Array.isArray(value)) throw new ValidationError(`${name} must be an array`);
  if (value.length > maxItems) {
    throw new LimitExceededError(`${name} exceeds the ${maxItems}-item limit`, { name, length: value.length });
  }
  return value;
}

/** Truncate a response to the configured output limit, with an explicit marker. */
export function truncateResult(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n… [output truncated by MCP server limit]';
}
