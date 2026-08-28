import { describe, it, expect, vi, afterEach } from "vitest";
import { getWorkerBaseUrl, getRoomWsUrl } from "../lib/realtime/url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getWorkerBaseUrl", () => {
  it("returns localhost fallback when env var is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_WORKER_URL", "");
    expect(getWorkerBaseUrl()).toBe("http://localhost:8787");
  });

  it("trims trailing slash from env var", () => {
    vi.stubEnv("NEXT_PUBLIC_WORKER_URL", "https://example.com/");
    expect(getWorkerBaseUrl()).toBe("https://example.com");
  });

  it("returns env var unchanged when no trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_WORKER_URL", "https://example.com");
    expect(getWorkerBaseUrl()).toBe("https://example.com");
  });
});

describe("getRoomWsUrl", () => {
  it("rewrites http: to ws:", () => {
    vi.stubEnv("NEXT_PUBLIC_WORKER_URL", "http://localhost:8787");
    const url = getRoomWsUrl("ABCD", "uid1", "Alice");
    expect(url.startsWith("ws://")).toBe(true);
  });

  it("rewrites https: to wss:", () => {
    vi.stubEnv("NEXT_PUBLIC_WORKER_URL", "https://worker.example.com");
    const url = getRoomWsUrl("ABCD", "uid1", "Alice");
    expect(url.startsWith("wss://")).toBe(true);
  });

  it("includes room code in path", () => {
    vi.stubEnv("NEXT_PUBLIC_WORKER_URL", "http://localhost:8787");
    const url = getRoomWsUrl("ABCD", "uid1", "Alice");
    expect(url).toContain("/rooms/ABCD");
  });

  it("includes uid and name as query params", () => {
    vi.stubEnv("NEXT_PUBLIC_WORKER_URL", "http://localhost:8787");
    const url = getRoomWsUrl("ABCD", "uid1", "Alice");
    const params = new URL(url).searchParams;
    expect(params.get("uid")).toBe("uid1");
    expect(params.get("name")).toBe("Alice");
  });

  it("URL-encodes spaces in name", () => {
    vi.stubEnv("NEXT_PUBLIC_WORKER_URL", "http://localhost:8787");
    const url = getRoomWsUrl("ABCD", "uid1", "John Doe");
    const params = new URL(url).searchParams;
    expect(params.get("name")).toBe("John Doe");
  });
});
