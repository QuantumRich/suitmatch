type Measurement = {
  lab: [number, number, number];
  confidence: number;
  lightingQuality: number;
  jacketVisibility: number;
  colorConsistency: number;
  swatchHex: string;
};

type Participant = {
  uid: string;
  name: string;
  measurement?: Measurement;
  updatedAt: number;
};

type RoomState = {
  code: string;
  referenceUid: string | null;
  participants: Participant[];
};

type ClientMsg =
  | { type: "measurement"; measurement: Measurement }
  | { type: "setReference"; uid: string }
  | { type: "ping" };

const STALE_MS = 10 * 60 * 1000;

export class SuitMatchRoom implements DurableObject {
  private state: DurableObjectState;
  private roomCode = "";

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    this.roomCode = parts[parts.length - 1] ?? "";

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const uid = url.searchParams.get("uid") ?? "anon";
    const name = url.searchParams.get("name") ?? "Unknown";

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server, [uid, name]);

    await this.initSchema();
    await this.upsertParticipant(uid, name);

    const roomState = await this.getRoomState(this.roomCode);
    server.send(JSON.stringify({ type: "state", room: roomState }));

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const tags = this.state.getTags(ws);
    const uid = tags[0] ?? "anon";

    let msg: ClientMsg;
    try {
      msg = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message));
    } catch {
      return;
    }

    if (msg.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
      await this.touchParticipant(uid);
      return;
    }

    if (msg.type === "measurement") {
      await this.saveMeasurement(uid, msg.measurement);
    } else if (msg.type === "setReference") {
      await this.setReference(msg.uid);
    }

    await this.broadcast();
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    // hibernation handles cleanup
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    // hibernation handles cleanup
  }

  private async initSchema(): Promise<void> {
    this.state.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS participants (
        uid TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        measurement TEXT,
        updated_at INTEGER NOT NULL
      )`
    );
    this.state.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS room_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      )`
    );
  }

  private async upsertParticipant(uid: string, name: string): Promise<void> {
    this.state.storage.sql.exec(
      `INSERT INTO participants (uid, name, measurement, updated_at)
       VALUES (?, ?, NULL, ?)
       ON CONFLICT(uid) DO UPDATE SET name=excluded.name, updated_at=excluded.updated_at`,
      uid, name, Date.now()
    );
  }

  private async touchParticipant(uid: string): Promise<void> {
    this.state.storage.sql.exec(
      `UPDATE participants SET updated_at=? WHERE uid=?`,
      Date.now(), uid
    );
    await this.pruneStaleParticipants();
  }

  private async saveMeasurement(uid: string, m: Measurement): Promise<void> {
    this.state.storage.sql.exec(
      `UPDATE participants SET measurement=?, updated_at=? WHERE uid=?`,
      JSON.stringify(m), Date.now(), uid
    );
  }

  private async setReference(uid: string): Promise<void> {
    this.state.storage.sql.exec(
      `INSERT INTO room_meta (key, value) VALUES ('referenceUid', ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
      uid
    );
  }

  private async pruneStaleParticipants(): Promise<void> {
    const cutoff = Date.now() - STALE_MS;
    this.state.storage.sql.exec(
      `DELETE FROM participants WHERE updated_at < ?`,
      cutoff
    );
  }

  private async getRoomState(code: string): Promise<RoomState> {
    await this.pruneStaleParticipants();

    const rows = [...this.state.storage.sql.exec(
      `SELECT uid, name, measurement, updated_at FROM participants ORDER BY updated_at ASC`
    )];

    const participants: Participant[] = rows.map((r) => ({
      uid: String(r.uid),
      name: String(r.name),
      measurement: r.measurement ? JSON.parse(String(r.measurement)) : undefined,
      updatedAt: Number(r.updated_at),
    }));

    const metaRows = [...this.state.storage.sql.exec(
      `SELECT value FROM room_meta WHERE key='referenceUid'`
    )];
    let referenceUid: string | null = metaRows[0] ? String(metaRows[0].value) : null;

    if (referenceUid && !participants.find((p) => p.uid === referenceUid)) {
      referenceUid = participants[0]?.uid ?? null;
      if (referenceUid) await this.setReference(referenceUid);
    }
    if (!referenceUid && participants.length > 0) {
      referenceUid = participants[0].uid;
      await this.setReference(referenceUid);
    }

    return { code, referenceUid, participants };
  }

  private async broadcast(): Promise<void> {
    const state = await this.getRoomState(this.roomCode);
    const msg = JSON.stringify({ type: "state", room: state });
    for (const ws of this.state.getWebSockets()) {
      try { ws.send(msg); } catch { /* ignore closed */ }
    }
  }
}
