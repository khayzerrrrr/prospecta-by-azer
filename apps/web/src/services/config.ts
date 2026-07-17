const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

export const API_BASE_URL = `${API_ORIGIN}/api`;

export const WS_URL = API_ORIGIN
  ? `${API_ORIGIN.replace(/^http/, "ws")}/ws`
  : `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws`;
