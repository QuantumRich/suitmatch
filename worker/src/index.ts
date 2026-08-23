import { SuitMatchRoom } from "./SuitMatchRoom";

export { SuitMatchRoom };

interface Env {
  SUIT_ROOM: DurableObjectNamespace;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Upgrade, Connection",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/rooms\/([A-Z2-9]{4,6})$/i);
    if (!match) {
      return new Response("Not found", { status: 404 });
    }

    const code = match[1].toUpperCase();
    const id = env.SUIT_ROOM.idFromName(code);
    const stub = env.SUIT_ROOM.get(id);

    return stub.fetch(request);
  },
};
