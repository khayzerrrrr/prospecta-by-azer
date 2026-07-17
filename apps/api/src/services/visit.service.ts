import { db, visits, leads, analyticsEvents, followUps } from "@visitflow/db";
import { eq, and, sql, inArray, or } from "drizzle-orm";
import { haversineDistance } from "@visitflow/utils";
import { getSubordinateUserIds } from "../middleware/rbac";
import { getJobTitleLevel } from "@visitflow/shared/constants/job-titles";

const MAX_CHECKIN_DISTANCE_M = 500;

class VisitService {
  async list(params: any, user: any) {
    const { page = 1, perPage = 20, status, leadId } = params;
    const conditions: any[] = [eq(visits.companyId, user.companyId)];
    if (user.role !== "super_admin" && user.role !== "admin") {
      // Union of: own visits, (manager) visits on territory leads,
      // (hierarchy) visits owned by subordinate job titles.
      const scopeConditions = [eq(visits.userId, user.id)];
      if (user.role === "manager" && user.territoryId) {
        const territoryLeadIds = (await db.select({ id: leads.id }).from(leads).where(eq(leads.territoryId, user.territoryId))).map((l) => l.id);
        if (territoryLeadIds.length > 0) scopeConditions.push(inArray(visits.leadId, territoryLeadIds));
      }
      const viewerLevel = getJobTitleLevel(user.jobTitle);
      if (viewerLevel > 1) {
        const subordinateIds = await getSubordinateUserIds(user.companyId, viewerLevel);
        if (subordinateIds.length > 0) scopeConditions.push(inArray(visits.userId, subordinateIds));
      }
      conditions.push(or(...scopeConditions)!);
    }
    if (status) conditions.push(eq(visits.status as any, status));
    if (leadId) conditions.push(eq(visits.leadId, leadId));
    const whereClause = and(...conditions);

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(visits).where(whereClause);
    const total = countResult[0]?.count ?? 0;

    const data = await db.select().from(visits).where(whereClause).limit(perPage).offset((page - 1) * perPage);
    return { success: true, data, pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  async getById(id: string) {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    if (!visit) throw new Error("Visit not found");
    return visit;
  }

  async create(data: any, user: any) {
    const id = crypto.randomUUID();
    await db.insert(visits).values({ id, ...data, companyId: user.companyId, userId: user.id });
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit;
  }

  async checkin(visitId: string, coords: { latitude: number; longitude: number }, user: any) {
    const [visit] = await db.select().from(visits).where(eq(visits.id, visitId));
    if (!visit) throw new Error("Visit not found");

    const [lead] = await db.select().from(leads).where(eq(leads.id, visit.leadId));
    let distance: number | null = null;
    if (lead?.latitude && lead?.longitude) {
      distance = haversineDistance(coords.latitude, coords.longitude, lead.latitude, lead.longitude);
      if (distance > MAX_CHECKIN_DISTANCE_M) {
        throw new Error(`Terlalu jauh (${Math.round(distance)}m). Maks ${MAX_CHECKIN_DISTANCE_M}m`);
      }
    }

    const now = new Date();
    await db.update(visits).set({
      status: "checked_in", checkinTime: now,
      checkinLat: coords.latitude, checkinLng: coords.longitude,
      checkinDistanceMeters: distance, updatedAt: now,
    }).where(eq(visits.id, visitId));

    await db.insert(analyticsEvents).values({
      companyId: user.companyId, userId: user.id, eventType: "visit_checkin",
      payload: { visitId, leadId: visit.leadId },
    });

    const [updated] = await db.select().from(visits).where(eq(visits.id, visitId));
    return updated;
  }

  async checkout(visitId: string, coords: { latitude: number; longitude: number }, notes: string | null, nextSteps: string | null, user: any) {
    const [visit] = await db.select().from(visits).where(eq(visits.id, visitId));
    if (!visit) throw new Error("Visit not found");

    const now = new Date();
    const duration = visit.checkinTime ? Math.round((now.getTime() - new Date(visit.checkinTime).getTime()) / 60000) : null;

    await db.update(visits).set({
      status: "completed", checkoutTime: now,
      checkoutLat: coords.latitude, checkoutLng: coords.longitude,
      meetingNotes: notes, nextSteps, durationMinutes: duration, updatedAt: now,
    }).where(eq(visits.id, visitId));

    if (nextSteps) {
      await db.insert(followUps).values({
        companyId: user.companyId,
        leadId: visit.leadId, visitId, userId: user.id,
        title: `Follow-up: ${nextSteps.slice(0, 100)}`,
        description: nextSteps,
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        priority: "medium", type: "task",
      });
    }

    const [updated] = await db.select().from(visits).where(eq(visits.id, visitId));
    return updated;
  }
}

export const visitService = new VisitService();
