import { ValidationError } from '../shared/errors.js';
import { requireString } from './limits.js';

/** Reject control characters that could break logs or transports, while allowing Tamil text. */
export function sanitizeUserText(value: string, name: string): string {
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) {
    throw new ValidationError(`${name} contains disallowed control characters`);
  }
  return value.normalize('NFC');
}

export function readCodeArgument(value: unknown, maxChars: number): string {
  const raw = requireString(value, 'code', maxChars);
  const text = sanitizeUserText(raw, 'code');
  if (text.trim().length === 0) {
    throw new ValidationError('code must not be empty');
  }
  return text;
}

export function readQueryArgument(value: unknown, maxChars: number): string {
  const raw = requireString(value, 'query', maxChars);
  const text = sanitizeUserText(raw, 'query');
  if (text.trim().length === 0) {
    throw new ValidationError('query must not be empty');
  }
  return text;
}

/** Only allow safe identifier characters in example/resource IDs. */
export function safeId(value: unknown, name: string): string {
  const raw = requireString(value, name, 200);
  if (!/^[\p{L}\p{M}\p{N}_:./*-]+$/u.test(raw)) {
    throw new ValidationError(`${name} contains unsupported characters`);
  }
  if (raw.includes('..') || raw.includes('\\') || raw.startsWith('/')) {
    throw new ValidationError(`${name} must not contain path traversal sequences`);
  }
  return raw;
}
