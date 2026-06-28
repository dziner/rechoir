import { createHash, timingSafeEqual } from 'node:crypto';

function hashSecret(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

export function checkPassword(provided: string): boolean {
  const expected = process.env.EDIT_PASSWORD;
  if (!expected) {
    // If no password is configured, reject all attempts
    return false;
  }

  return timingSafeEqual(hashSecret(provided), hashSecret(expected));
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
  };
}
