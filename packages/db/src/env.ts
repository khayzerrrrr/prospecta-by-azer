export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production" || process.env.RENDER === "true") {
    throw new Error("DATABASE_URL is required in production");
  }
  return "postgresql://visitflow:visitflow_secret@localhost:5432/visitflow";
}
