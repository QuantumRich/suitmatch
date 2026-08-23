"use client";

import { getRoomWsUrl } from "./url";
import type { ClientMsg, Measurement, RoomState, ServerMsg } from "./types";

export type RoomHandle = {
  sendMeasurement: (m: Measurement) => void;
  setReference: (uid: string) => void;
  close: () => void;
};

export type RoomCallbacks = {
  onState: (state: RoomState) => void;
  onError: (msg: string) => void;
  onClose: () => void;
};

export function openRoom(
  code: string,
  uid: string,
  name: string,
  callbacks: RoomCallbacks
): RoomHandle {
  const url = getRoomWsUrl(code, uid, name);
  let ws: WebSocket | null = new WebSocket(url);
  let alive = true;
  let pingInterval: ReturnType<typeof setInterval>;

  ws.onopen = () => {
    pingInterval = setInterval(() => send({ type: "ping" }), 20_000);
  };

  ws.onmessage = (ev) => {
    try {
      const msg: ServerMsg = JSON.parse(ev.data);
      if (msg.type === "state") callbacks.onState(msg.room);
      if (msg.type === "error") callbacks.onError(msg.message);
    } catch {
      // ignore malformed messages
    }
  };

  ws.onerror = () => callbacks.onError("WebSocket error");
  ws.onclose = () => {
    clearInterval(pingInterval);
    if (alive) callbacks.onClose();
  };

  function send(msg: ClientMsg) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  return {
    sendMeasurement: (measurement) => send({ type: "measurement", measurement }),
    setReference: (uid) => send({ type: "setReference", uid }),
    close: () => {
      alive = false;
      clearInterval(pingInterval);
      ws?.close();
      ws = null;
    },
  };
}
