import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./routes/auth.route";
import { leadRoutes } from "./routes/leads.route";
import { visitRoutes } from "./routes/visits.route";
import { pipelineRoutes } from "./routes/pipeline.route";
import { routeRoutes } from "./routes/routes.route";
import { analyticsRoutes } from "./routes/analytics.route";
import { packRoutes } from "./routes/packs.route";
import { env } from "./config/env";
import { wsServer } from "./ws";
import { HttpError } from "./utils/errors";

export const app = new Elysia()
  .use(swagger({
    path: "/docs",
    documentation: {
      info: {
        title: "Prospecta API",
        version: "1.0.0",
        description: "Prospecta by Azer — CRM Manajemen Kunjungan Lapangan",
      },
    },
  }))
  .use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }))
  .onError(({ error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.status;
      return { success: false, error: error.message };
    }
    set.status = 500;
    return { success: false, error: (error as Error).message || "Internal server error" };
  })
  .group("/api", (api) => api
    .use(authRoutes)
    .use(leadRoutes)
    .use(visitRoutes)
    .use(pipelineRoutes)
    .use(routeRoutes)
    .use(analyticsRoutes)
    .use(packRoutes)
  )
  .use(wsServer)
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }));
