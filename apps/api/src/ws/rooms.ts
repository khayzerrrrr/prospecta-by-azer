import type { ServerWebSocket } from "bun";

const rooms = new Map<string, Set<ServerWebSocket<any>>>();

export function joinRoom(roomName: string, ws: ServerWebSocket<any>) {
  if (!rooms.has(roomName)) rooms.set(roomName, new Set());
  rooms.get(roomName)!.add(ws);
}

export function leaveRoom(roomName: string, ws: ServerWebSocket<any>) {
  rooms.get(roomName)?.delete(ws);
  if (rooms.get(roomName)?.size === 0) rooms.delete(roomName);
}

export function leaveAllRooms(ws: ServerWebSocket<any>) {
  for (const [room, clients] of rooms) {
    clients.delete(ws);
    if (clients.size === 0) rooms.delete(room);
  }
}

export function broadcast(roomName: string, message: any) {
  const clients = rooms.get(roomName);
  if (!clients) return;
  const data = JSON.stringify(message);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

export function sendToUser(userId: string, message: any) {
  broadcast(`user:${userId}`, message);
}
