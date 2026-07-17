import { Elysia } from "elysia";
import { db, routes, routeStops, leads, users } from "@visitflow/db";
import { eq, asc, inArray, sql } from "drizzle-orm";
import { haversineDistance } from "@visitflow/utils";
import { getAuthUser } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { ownershipGuard } from "../middleware/ownership";
import { UnauthorizedError, NotFoundError } from "../utils/errors";

// Routes have no territoryId of their own — manager scoping for this
// resource falls back to the owning agent's own territoryId instead.
const routeOwnership = ownershipGuard((id: string) => {
  const route = db.select().from(routes).where(eq(routes.id, id)).get();
  if (!route) return undefined;
  const owner = db.select().from(users).where(eq(users.id, route.userId)).get();
  return { ownerId: route.userId, territoryId: owner?.territoryId ?? null };
});

export const routeRoutes = new Elysia({ prefix: "/routes" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  .get("/", async ({ user }) => {
    let q = db.select().from(routes).$dynamic();
    if (user.role === "agent") {
      q = q.where(eq(routes.userId, user.id));
    } else if (user.role === "manager") {
      if (!user.territoryId) return { success: true, data: [] };
      const territoryUserIds = db.select({ id: users.id }).from(users).where(eq(users.territoryId, user.territoryId)).all().map((u) => u.id);
      q = q.where(territoryUserIds.length > 0 ? inArray(routes.userId, territoryUserIds) : sql`1=0`);
    }
    return { success: true, data: q.all() };
  }, { beforeHandle: requirePermission("routes:read") })
  .get("/:id", async ({ params }) => {
    const route = db.select().from(routes).where(eq(routes.id, params.id)).get();
    if (!route) throw new NotFoundError("Route not found");
    const stops = db.select({
      id: routeStops.id, stopOrder: routeStops.stopOrder, status: routeStops.status,
      leadId: routeStops.leadId, companyName: leads.companyName,
      latitude: leads.latitude, longitude: leads.longitude,
    }).from(routeStops).leftJoin(leads, eq(routeStops.leadId, leads.id))
      .where(eq(routeStops.routeId, params.id)).orderBy(asc(routeStops.stopOrder)).all();
    return { success: true, data: { ...route, stops } };
  }, { beforeHandle: [requirePermission("routes:read"), routeOwnership] })
  .post("/", async ({ body, user }) => {
    const id = crypto.randomUUID();
    db.insert(routes).values({ id, ...(body as any), userId: user.id }).run();
    return { success: true, data: db.select().from(routes).where(eq(routes.id, id)).get() };
  }, { beforeHandle: requirePermission("routes:write") })
  .post("/:id/stops", async ({ params, body }) => {
    const { leadId, stopOrder } = body as any;
    const id = crypto.randomUUID();
    db.insert(routeStops).values({ id, routeId: params.id, leadId, stopOrder }).run();
    return { success: true };
  }, { beforeHandle: [requirePermission("routes:write"), routeOwnership] })
  .post("/:id/optimize", async ({ params }) => {
    const stops = db.select({ id: routeStops.id, latitude: leads.latitude, longitude: leads.longitude })
      .from(routeStops).leftJoin(leads, eq(routeStops.leadId, leads.id))
      .where(eq(routeStops.routeId, params.id)).all();

    if (stops.length < 2) return { success: true, message: "Not enough stops" };
    const optimized: typeof stops = [];
    const remaining = [...stops];
    let current = remaining.shift()!;
    optimized.push(current);

    while (remaining.length > 0) {
      let nearest = 0, minDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        if (current.latitude && remaining[i]!.latitude) {
          const d = haversineDistance(current.latitude, current.longitude!, remaining[i]!.latitude!, remaining[i]!.longitude!);
          if (d < minDist) { minDist = d; nearest = i; }
        }
      }
      current = remaining.splice(nearest, 1)[0]!;
      optimized.push(current);
    }
    let totalDist = 0;
    for (let i = 0; i < optimized.length; i++) {
      db.update(routeStops).set({ stopOrder: i + 1 }).where(eq(routeStops.id, optimized[i]!.id)).run();
      if (i > 0 && optimized[i - 1]?.latitude && optimized[i]?.latitude) {
        totalDist += haversineDistance(optimized[i - 1]!.latitude!, optimized[i - 1]!.longitude!, optimized[i]!.latitude!, optimized[i]!.longitude!);
      }
    }
    totalDist = Math.round(totalDist / 10) / 100;
    db.update(routes).set({ totalDistanceKm: totalDist, estimatedDurationMinutes: Math.round(totalDist * 3) })
      .where(eq(routes.id, params.id)).run();
    return { success: true, data: { totalDistanceKm: totalDist } };
  }, { beforeHandle: [requirePermission("routes:write"), routeOwnership] });
