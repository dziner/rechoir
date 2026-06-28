export function checkPassword(provided: string): boolean {
  const expected = process.env.EDIT_PASSWORD;
  if (!expected) {
    // If no password is configured, reject all attempts
    return false;
  }
  return provided === expected;
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
  };
}
