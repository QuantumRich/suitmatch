// Maps a Discord instanceId to a SuitMatch room code.
// Uses first 6 chars of a base32-like encoding of the instanceId hash
// so it fits the existing room-code format [A-Z2-9] without colliding
// with human-entered 4-char codes (those are always length 4).

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, no ambiguous O/0/1/I

export async function instanceIdToRoomCode(instanceId: string): Promise<string> {
  const data = new TextEncoder().encode(instanceId);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hashBuffer);

  // Base32 encode first 5 bytes → 8 chars, take first 6
  let result = "";
  for (let i = 0; i < 5; i++) {
    const b = bytes[i];
    result += ALPHABET[b >> 3];
    if (result.length < 6) result += ALPHABET[(b & 0x7) << 2];
  }
  return result.slice(0, 6);
}
