import { db, leads } from "@visitflow/db";
import { eq, like, and, or, sql } from "drizzle-orm";

class LeadService {
  list(params: any, user: any) {
    const { page = 1, perPage = 20, search, status, qualification, sortBy = "createdAt", sortOrder = "desc" } = params;
    const conditions: any[] = [];

    if (user.role === "agent") {
      conditions.push(eq(leads.assignedTo, user.id));
    } else if (user.role === "manager") {
      if (!user.territoryId) return { data: [], pagination: { page, perPage, total: 0, totalPages: 0 } };
      conditions.push(eq(leads.territoryId, user.territoryId));
    }
    if (status) conditions.push(eq(leads.status as any, status));
    if (qualification) conditions.push(eq(leads.qualification as any, qualification));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Efficient count using SQL aggregation
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(leads).$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    if (search) {
      countQuery = countQuery.where(or(
        like(leads.companyName, `%${search}%`),
        like(leads.contactName, `%${search}%`),
        like(leads.city, `%${search}%`),
      ));
    }
    const countResult = countQuery.all();
    const total = countResult[0]?.count ?? 0;

    // Data query with pagination
    let query = db.select().from(leads).$dynamic();
    if (whereClause) query = query.where(whereClause);
    if (search) {
      query = query.where(or(
        like(leads.companyName, `%${search}%`),
        like(leads.contactName, `%${search}%`),
        like(leads.city, `%${search}%`),
      ));
    }

    const offset = (page - 1) * perPage;
    const data = query.limit(perPage).offset(offset).all();

    return { data, pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  getById(id: string) {
    const lead = db.select().from(leads).where(eq(leads.id, id)).get();
    if (!lead) throw new Error("Lead not found");
    return lead;
  }

  create(data: any, user: any) {
    const id = crypto.randomUUID();
    db.insert(leads).values({
      id, ...data, createdBy: user.id,
      assignedTo: data.assignedTo || user.id,
      territoryId: data.territoryId || user.territoryId,
    }).run();
    return db.select().from(leads).where(eq(leads.id, id)).get();
  }

  update(id: string, data: any) {
    db.update(leads).set(data).where(eq(leads.id, id)).run();
    return db.select().from(leads).where(eq(leads.id, id)).get();
  }

  delete(id: string) {
    db.delete(leads).where(eq(leads.id, id)).run();
  }
}

export const leadService = new LeadService();
