export interface ClientMessage {
  type: "location_update" | "ping" | "subscribe" | "unsubscribe" | "visit:checkin" | "visit:checkout";
  lat?: number;
  lng?: number;
  accuracy?: number;
  room?: string;
  visitId?: string;
  notes?: string;
}

export interface ServerMessage {
  type: "agent:location" | "visit:checkin" | "visit:checkout" | "notification:new" | "pipeline:deal_moved" | "follow_up:overdue" | "pong" | "error";
  userId?: string;
  userName?: string;
  lat?: number;
  lng?: number;
  timestamp?: string;
  visitId?: string;
  leadName?: string;
  duration?: number;
  notification?: any;
  dealId?: string;
  fromStage?: string;
  toStage?: string;
  followUpId?: string;
  title?: string;
  dueDate?: string;
  code?: string;
  message?: string;
}
