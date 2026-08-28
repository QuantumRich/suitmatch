import { describe, it, expect } from "vitest";
import { generateRoomCode, isValidRoomCode, normalizeCode } from "../lib/util/roomCode";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

describe("generateRoomCode", () => {
  it("default produces a 4-character code", () => {
    expect(generateRoomCode()).toHaveLength(4);
  });

  it("every character is in the allowed set (no O/0/1/I)", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode();
      for (const c of code) expect(CHARS).toContain(c);
    }
  });

  it("generateRoomCode(6) produces 6-char codes", () => {
    expect(generateRoomCode(6)).toHaveLength(6);
  });

  it("1000 generated codes all pass isValidRoomCode", () => {
    for (let i = 0; i < 1000; i++) {
      expect(isValidRoomCode(generateRoomCode())).toBe(true);
    }
  });
});

describe("isValidRoomCode", () => {
  it("accepts a valid 4-char code", () => {
    expect(isValidRoomCode("ABCD")).toBe(true);
  });

  it("accepts 5-char and 6-char codes", () => {
    expect(isValidRoomCode("ABCDE")).toBe(true);
    expect(isValidRoomCode("ABCDEF")).toBe(true);
  });

  it("rejects length < 4", () => {
    expect(isValidRoomCode("AB")).toBe(false);
    expect(isValidRoomCode("")).toBe(false);
  });

  it("rejects length > 6", () => {
    expect(isValidRoomCode("ABCDEFG")).toBe(false);
  });

  it("rejects codes containing ambiguous chars O, 0, 1, I", () => {
    expect(isValidRoomCode("OABC")).toBe(false);
    expect(isValidRoomCode("0ABC")).toBe(false);
    expect(isValidRoomCode("1ABC")).toBe(false);
    expect(isValidRoomCode("IABC")).toBe(false);
  });
});

describe("normalizeCode", () => {
  it("uppercases lowercase input", () => {
    expect(normalizeCode("abcd")).toBe("ABCD");
  });

  it("trims whitespace", () => {
    expect(normalizeCode("  ABCD  ")).toBe("ABCD");
  });

  it("handles mixed case + whitespace", () => {
    expect(normalizeCode("  Ab3x ")).toBe("AB3X");
  });
});
