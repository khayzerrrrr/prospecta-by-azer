import { db, officeLocations } from "@visitflow/db";
import { eq, and } from "drizzle-orm";

class OfficeLocationService {
  async list(companyId: string) {
    return db.select().from(officeLocations).where(and(eq(officeLocations.companyId, companyId), eq(officeLocations.isActive, true)));
  }

  async create(data: any, companyId: string) {
    const [row] = await db.insert(officeLocations).values({
      companyId, name: data.name, address: data.address || null,
      latitude: data.latitude, longitude: data.longitude,
      radiusMeters: data.radiusMeters || 100,
    }).returning();
    return row;
  }

  async update(id: string, data: any) {
    const fields: any = {};
    for (const key of ["name", "address", "latitude", "longitude", "radiusMeters", "isActive"]) {
      if (data[key] !== undefined) fields[key] = data[key];
    }
    await db.update(officeLocations).set(fields).where(eq(officeLocations.id, id));
    const [row] = await db.select().from(officeLocations).where(eq(officeLocations.id, id));
    return row;
  }
}

export const officeLocationService = new OfficeLocationService();
