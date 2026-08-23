function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const isBrowser = typeof window !== "undefined";

export function getUserId(): string {
  if (!isBrowser) return "";
  let uid = localStorage.getItem("suitmatch_uid");
  if (!uid) {
    uid = randomId();
    localStorage.setItem("suitmatch_uid", uid);
  }
  return uid;
}

export function getDisplayName(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem("suitmatch_name");
}

export function setDisplayName(name: string): void {
  if (!isBrowser) return;
  localStorage.setItem("suitmatch_name", name.trim().slice(0, 30));
}

export function clearDisplayName(): void {
  if (!isBrowser) return;
  localStorage.removeItem("suitmatch_name");
}
