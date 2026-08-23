import type { Measurement } from "../color/pipeline";

export type { Measurement };

export type Participant = {
  uid: string;
  name: string;
  measurement?: Measurement;
  updatedAt: number;
};

export type RoomState = {
  code: string;
  referenceUid: string | null;
  participants: Participant[];
};

// Client → server
export type ClientMsg =
  | { type: "measurement"; measurement: Measurement }
  | { type: "setReference"; uid: string }
  | { type: "ping" };

// Server → client
export type ServerMsg =
  | { type: "state"; room: RoomState }
  | { type: "error"; message: string }
  | { type: "pong" };
