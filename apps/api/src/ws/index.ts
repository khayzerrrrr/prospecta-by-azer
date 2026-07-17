import { Elysia, t } from "elysia";
import { joinRoom, leaveAllRooms, broadcast } from "./rooms";
import { verifyJwt } from "../utils/jwt";

export const wsServer = new Elysia()
  .ws("/ws", {
    body: t.Object({
      type: t.Optional(t.String()),
      payload: t.Optional(t.Any()),
    }),
    query: t.Object({
      token: t.String(),
    }),
    async open(ws) {
      try {
        const token = (ws.data.query as any)?.token;
        if (!token) { ws.close(); return; }

        const payload = await verifyJwt(token);
        if (!payload || !payload.sub) { ws.close(); return; }

        (ws.data as any).userId = payload.sub;
        (ws.data as any).role = payload.role;
        (ws.data as any).fullName = payload.fullName;
        (ws.data as any).companyId = payload.companyId;

        joinRoom(`user:${payload.sub}`, ws as any);
        // Company-scoped room so location broadcasts reach teammates
        // (e.g. managers watching the live map), not just the sender.
        if (payload.companyId) joinRoom(`company:${payload.companyId}`, ws as any);

        console.log(`WS: ${payload.fullName} connected`);
      } catch {
        ws.close();
      }
    },

    message(ws, msg) {
      try {
        const data = typeof msg === "object" ? msg : (typeof msg === "string" ? JSON.parse(msg) : null);
        if (!data || typeof data !== "object" || !data.type) return;

        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }

        if (data.type === "location_update") {
          const { latitude, longitude } = data.payload || {};
          const companyId = (ws.data as any).companyId;
          if (companyId) {
            broadcast(`company:${companyId}`, JSON.stringify({
              type: "agent_location",
              userId: (ws.data as any).userId,
              fullName: (ws.data as any).fullName,
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
            }));
          }
        }
      } catch {}
    },

    close(ws) {
      leaveAllRooms(ws as any);
    },
  });
