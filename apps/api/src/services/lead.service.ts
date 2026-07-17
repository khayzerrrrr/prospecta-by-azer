import { db, leads } from "@visitflow/db";
import { eq, like, and, or, sql } from "drizzle-orm";

class LeadService {
  async list(params: any, user: any) {
    const { page = 1, perPage = 20, search, status, qualification } = params;
    const conditions: any[] = [eq(leads.companyId, user.companyId)];

    if (user.role === "agent") {
      conditions.push(eq(leads.assignedTo, user.id));
    } else if (user.role === "manager") {
      if (!user.territoryId) return { data: [], pagination: { page, perPage, total: 0, totalPages: 0 } };
      conditions.push(eq(leads.territoryId, user.territoryId));
    }
    if (status) conditions.push(eq(leads.status as any, status));
    if (qualification) conditions.push(eq(leads.qualification as any, qualification));
    if (search) {
      conditions.push(or(
        like(leads.companyName, `%${search}%`),
        like(leads.contactName, `%${search}%`),
        like(leads.city, `%${search}%`),
      ));
    }

    const whereClause = and(...conditions);

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(leads).where(whereClause);
    const total = countResult[0]?.count ?? 0;

    const offset = (page - 1) * perPage;
    const data = await db.select().from(leads).where(whereClause).limit(perPage).offset(offset);

    return { data, pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  async getById(id: string) {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    if (!lead) throw new Error("Lead not found");
    return lead;
  }

  async create(data: any, user: any) {
    const id = crypto.randomUUID();
    await db.insert(leads).values({
      id, ...data, companyId: user.companyId, createdBy: user.id,
      assignedTo: data.assignedTo || user.id,
      territoryId: data.territoryId || user.territoryId,
    });
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async update(id: string, data: any) {
    await db.update(leads).set(data).where(eq(leads.id, id));
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async delete(id: string) {
    await db.delete(leads).where(eq(leads.id, id));
  }
}

export const leadService = new LeadService();
