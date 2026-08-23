const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/1/I for readability

export function generateRoomCode(len = 4): string {
  let code = "";
  for (let i = 0; i < len; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function isValidRoomCode(code: string): boolean {
  if (code.length < 4 || code.length > 6) return false;
  return code.split("").every((c) => CHARS.includes(c.toUpperCase()));
}

export function normalizeCode(code: string): string {
  return code.toUpperCase().trim();
}
