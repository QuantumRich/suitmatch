export function getWorkerBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_WORKER_URL;
  if (!url) {
    // In development without a worker running, fall back to localhost
    return "http://localhost:8787";
  }
  return url.replace(/\/$/, "");
}

export function getRoomWsUrl(code: string, uid: string, name: string): string {
  const base = getWorkerBaseUrl()
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");
  const params = new URLSearchParams({ uid, name });
  return `${base}/rooms/${code}?${params.toString()}`;
}
