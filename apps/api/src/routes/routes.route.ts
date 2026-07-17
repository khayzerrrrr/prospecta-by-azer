import { Elysia } from "elysia";
import { db, routes, routeStops, leads, users } from "@visitflow/db";
import { eq, asc, inArray, sql, and } from "drizzle-orm";
import { haversineDistance } from "@visitflow/utils";
import { getAuthUser } from "../middleware/auth";
import { requirePermission, getSubordinateUserIds } from "../middleware/rbac";
import { getJobTitleLevel } from "@visitflow/shared/constants/job-titles";
import { ownershipGuard } from "../middleware/ownership";
import { UnauthorizedError, NotFoundError } from "../utils/errors";

// Routes have no territoryId of their own — manager scoping for this
// resource falls back to the owning agent's own territoryId instead.
const routeOwnership = ownershipGuard(async (id: string) => {
  const [route] = await db.select().from(routes).where(eq(routes.id, id));
  if (!route) return undefined;
  const [owner] = await db.select().from(users).where(eq(users.id, route.userId));
  return { ownerId: route.userId, ownerJobTitle: owner?.jobTitle ?? null, territoryId: owner?.territoryId ?? null, companyId: route.companyId };
});

export const routeRoutes = new Elysia({ prefix: "/routes" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  .get("/", async ({ user }) => {
    const conditions = [eq(routes.companyId, user.companyId!)];
    if (user.role !== "super_admin" && user.role !== "admin") {
      const visibleIds = new Set<string>([user.id]);
      if (user.role === "manager" && user.territoryId) {
        (await db.select({ id: users.id }).from(users).where(eq(users.territoryId, user.territoryId))).forEach((u) => visibleIds.add(u.id));
      }
      const viewerLevel = getJobTitleLevel(user.jobTitle);
      if (viewerLevel > 1) {
        (await getSubordinateUserIds(user.companyId!, viewerLevel)).forEach((id) => visibleIds.add(id));
      }
      conditions.push(visibleIds.size > 0 ? inArray(routes.userId, [...visibleIds]) : sql`1=0`);
    }
    const data = await db.select().from(routes).where(and(...conditions));
    return { success: true, data };
  }, { beforeHandle: requirePermission("routes:read") })
  .get("/:id", async ({ params }) => {
    const [route] = await db.select().from(routes).where(eq(routes.id, params.id));
    if (!route) throw new NotFoundError("Route not found");
    const stops = await db.select({
      id: routeStops.id, stopOrder: routeStops.stopOrder, status: routeStops.status,
      leadId: routeStops.leadId, companyName: leads.companyName,
      latitude: leads.latitude, longitude: leads.longitude,
    }).from(routeStops).leftJoin(leads, eq(routeStops.leadId, leads.id))
      .where(eq(routeStops.routeId, params.id)).orderBy(asc(routeStops.stopOrder));
    return { success: true, data: { ...route, stops } };
  }, { beforeHandle: [requirePermission("routes:read"), routeOwnership] })
  .post("/", async ({ body, user }) => {
    const id = crypto.randomUUID();
    await db.insert(routes).values({ id, ...(body as any), companyId: user.companyId!, userId: user.id });
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return { success: true, data: route };
  }, { beforeHandle: requirePermission("routes:write") })
  .post("/:id/stops", async ({ params, body, user }) => {
    const { leadId, stopOrder } = body as any;
    const id = crypto.randomUUID();
    await db.insert(routeStops).values({ id, companyId: user.companyId!, routeId: params.id, leadId, stopOrder });
    return { success: true };
  }, { beforeHandle: [requirePermission("routes:write"), routeOwnership] })
  .post("/:id/optimize", async ({ params }) => {
    const stops = await db.select({ id: routeStops.id, latitude: leads.latitude, longitude: leads.longitude })
      .from(routeStops).leftJoin(leads, eq(routeStops.leadId, leads.id))
      .where(eq(routeStops.routeId, params.id));

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
      await db.update(routeStops).set({ stopOrder: i + 1 }).where(eq(routeStops.id, optimized[i]!.id));
      if (i > 0 && optimized[i - 1]?.latitude && optimized[i]?.latitude) {
        totalDist += haversineDistance(optimized[i - 1]!.latitude!, optimized[i - 1]!.longitude!, optimized[i]!.latitude!, optimized[i]!.longitude!);
      }
    }
    totalDist = Math.round(totalDist / 10) / 100;
    await db.update(routes).set({ totalDistanceKm: totalDist, estimatedDurationMinutes: Math.round(totalDist * 3) })
      .where(eq(routes.id, params.id));
    return { success: true, data: { totalDistanceKm: totalDist } };
  }, { beforeHandle: [requirePermission("routes:write"), routeOwnership] });
