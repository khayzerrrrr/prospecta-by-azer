// IndexedDB queue for offline operations
const DB_NAME = "visitflow-offline";
const STORE_NAME = "pending-operations";

interface QueuedOperation {
  id: string;
  type: "visit:checkin" | "visit:checkout" | "visit:photo" | "visit:signature";
  endpoint: string;
  method: string;
  payload: any;
  createdAt: string;
  retryCount: number;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueOperation(op: Omit<QueuedOperation, "id" | "createdAt" | "retryCount">): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.add({
    ...op,
    id: generateId(),
    createdAt: new Date().toISOString(),
    retryCount: 0,
  });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncQueue(): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const ops = await new Promise<QueuedOperation[]>((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });

  let synced = 0;
  for (const op of ops) {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(op.endpoint, {
        method: op.method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(op.payload),
      });
      // Only delete on success (2xx). Keep 4xx/5xx for retry.
      if (res.ok) {
        store.delete(op.id);
        synced++;
      } else if (res.status >= 400 && res.status < 500) {
        // Client error (4xx) — don't retry, log it
        console.warn(`Offline sync failed (4xx) for ${op.type}:`, await res.text().catch(() => ""));
        store.delete(op.id);
        synced++;
      }
      // 5xx errors: keep in queue for retry
    } catch {
      // Network error: keep in queue for retry on next sync
    }
  }

  await new Promise<void>((resolve) => {
    tx.oncomplete = () => resolve();
  });

  return synced;
}

export function listenForReconnect() {
  window.addEventListener("online", async () => {
    const synced = await syncQueue();
    if (synced > 0) {
      console.log(`Synced ${synced} offline operations`);
    }
  });
}
