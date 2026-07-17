const isProd = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

function required(name: string, devFallback: string): string {
  const val = process.env[name];
  if (val) return val;
  if (isProd) throw new Error(`Missing required env var ${name} in production`);
  return devFallback;
}

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL: process.env.DATABASE_URL || "../../data/visitflow.db",
  JWT_SECRET: required("JWT_SECRET", "dev-secret-change-in-production"),
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "7d",
  CORS_ORIGIN: required("CORS_ORIGIN", "*"),
  UPLOAD_DIR: process.env.UPLOAD_DIR || "./uploads",
  MAX_FILE_SIZE: Number(process.env.MAX_FILE_SIZE) || 10_485_760,
};
