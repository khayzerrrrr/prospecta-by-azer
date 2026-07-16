const BASE_URL = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Auth errors — clear token and redirect
  if (res.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  const json = await res.json();

  // Handle "Invalid token" even when status is 200
  if (!json.success) {
    if (json.error === "Invalid token" || json.error === "Unauthorized") {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    throw new Error(json.error || "Request failed");
  }

  return json as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: any) => request<T>(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  }),
  patch: <T>(url: string, body?: any) => request<T>(url, {
    method: "PATCH",
    body: JSON.stringify(body),
  }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
