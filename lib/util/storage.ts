"use client";

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function getUserId(): string {
  let uid = localStorage.getItem("suitmatch_uid");
  if (!uid) {
    uid = randomId();
    localStorage.setItem("suitmatch_uid", uid);
  }
  return uid;
}

export function getDisplayName(): string | null {
  return localStorage.getItem("suitmatch_name");
}

export function setDisplayName(name: string): void {
  localStorage.setItem("suitmatch_name", name.trim().slice(0, 30));
}

export function clearDisplayName(): void {
  localStorage.removeItem("suitmatch_name");
}
