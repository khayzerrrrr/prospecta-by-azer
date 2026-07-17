import { db, visits, leads, analyticsEvents, followUps } from "@visitflow/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import { haversineDistance } from "@visitflow/utils";

const MAX_CHECKIN_DISTANCE_M = 500;

class VisitService {
  list(params: any, user: any) {
    const { page = 1, perPage = 20, status, leadId } = params;
    const conditions: any[] = [];
    if (user.role === "agent") {
      conditions.push(eq(visits.userId, user.id));
    } else if (user.role === "manager") {
      if (!user.territoryId) return { success: true, data: [], pagination: { page, perPage, total: 0, totalPages: 0 } };
      const territoryLeadIds = db.select({ id: leads.id }).from(leads).where(eq(leads.territoryId, user.territoryId)).all().map((l) => l.id);
      conditions.push(territoryLeadIds.length > 0 ? inArray(visits.leadId, territoryLeadIds) : sql`1=0`);
    }
    if (status) conditions.push(eq(visits.status as any, status));
    if (leadId) conditions.push(eq(visits.leadId, leadId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let countQuery = db.select({ count: sql<number>`count(*)` }).from(visits).$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const countResult = countQuery.all();
    const total = countResult[0]?.count ?? 0;

    let query = db.select().from(visits).$dynamic();
    if (whereClause) query = query.where(whereClause);
    const data = query.limit(perPage).offset((page - 1) * perPage).all();
    return { success: true, data, pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  getById(id: string) {
    const visit = db.select().from(visits).where(eq(visits.id, id)).get();
    if (!visit) throw new Error("Visit not found");
    return visit;
  }

  create(data: any, user: any) {
    const id = crypto.randomUUID();
    db.insert(visits).values({ id, ...data, userId: user.id }).run();
    return db.select().from(visits).where(eq(visits.id, id)).get();
  }

  checkin(visitId: string, coords: { latitude: number; longitude: number }, user: any) {
    const visit = db.select().from(visits).where(eq(visits.id, visitId)).get();
    if (!visit) throw new Error("Visit not found");

    const lead = db.select().from(leads).where(eq(leads.id, visit.leadId)).get();
    let distance: number | null = null;
    if (lead?.latitude && lead?.longitude) {
      distance = haversineDistance(coords.latitude, coords.longitude, lead.latitude, lead.longitude);
      if (distance > MAX_CHECKIN_DISTANCE_M) {
        throw new Error(`Terlalu jauh (${Math.round(distance)}m). Maks ${MAX_CHECKIN_DISTANCE_M}m`);
      }
    }

    const now = new Date();
    db.update(visits).set({
      status: "checked_in", checkinTime: now,
      checkinLat: coords.latitude, checkinLng: coords.longitude,
      checkinDistanceMeters: distance, updatedAt: now,
    }).where(eq(visits.id, visitId)).run();

    db.insert(analyticsEvents).values({
      userId: user.id, eventType: "visit_checkin",
      payload: JSON.stringify({ visitId, leadId: visit.leadId }),
    }).run();

    return db.select().from(visits).where(eq(visits.id, visitId)).get();
  }

  checkout(visitId: string, coords: { latitude: number; longitude: number }, notes: string | null, nextSteps: string | null, user: any) {
    const visit = db.select().from(visits).where(eq(visits.id, visitId)).get();
    if (!visit) throw new Error("Visit not found");

    const now = new Date();
    const duration = visit.checkinTime ? Math.round((now.getTime() - new Date(visit.checkinTime).getTime()) / 60000) : null;

    db.update(visits).set({
      status: "completed", checkoutTime: now,
      checkoutLat: coords.latitude, checkoutLng: coords.longitude,
      meetingNotes: notes, nextSteps, durationMinutes: duration, updatedAt: now,
    }).where(eq(visits.id, visitId)).run();

    if (nextSteps) {
      db.insert(followUps).values({
        leadId: visit.leadId, visitId, userId: user.id,
        title: `Follow-up: ${nextSteps.slice(0, 100)}`,
        description: nextSteps,
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        priority: "medium", type: "task",
      }).run();
    }

    return db.select().from(visits).where(eq(visits.id, visitId)).get();
  }
}

export const visitService = new VisitService();
