import { db, attendance, employeeProfiles, officeLocations, users } from "@visitflow/db";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";
import { haversineDistance } from "@visitflow/utils";

class AttendanceService {
  async getById(id: string) {
    const [row] = await db.select().from(attendance).where(eq(attendance.id, id));
    if (!row) throw new Error("Attendance record not found");
    return row;
  }

  async getToday(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const [row] = await db.select().from(attendance).where(and(eq(attendance.userId, userId), eq(attendance.date, today)));
    return row ?? null;
  }

  async list(params: any, user: any) {
    const { dateFrom, dateTo, userId } = params;
    const conditions = [eq(attendance.companyId, user.companyId)];
    if (user.role === "agent") {
      conditions.push(eq(attendance.userId, user.id));
    } else if (user.role === "manager") {
      if (!user.territoryId) return [];
      const teammates = await db.select({ id: users.id }).from(users).where(eq(users.territoryId, user.territoryId));
      const ids = teammates.map((r) => r.id);
      conditions.push(ids.length > 0 ? inArray(attendance.userId, ids) : sql`1=0`);
    }
    if (userId) conditions.push(eq(attendance.userId, userId));
    if (dateFrom) conditions.push(gte(attendance.date, dateFrom));
    if (dateTo) conditions.push(lte(attendance.date, dateTo));
    return db.select().from(attendance).where(and(...conditions));
  }

  async checkin(user: any, coords: { latitude: number; longitude: number }, photoUrl: string | null) {
    const today = new Date().toISOString().slice(0, 10);
    const [existing] = await db.select().from(attendance).where(and(eq(attendance.userId, user.id), eq(attendance.date, today)));
    if (existing?.checkinTime) throw new Error("Sudah check-in hari ini");

    const [profile] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.userId, user.id));

    let officeLocationId: string | null = null;
    let distance: number | null = null;

    // Office staff are geofenced to a registered office location; field
    // staff check in from wherever their day starts (their job requires
    // travel, so no fixed geofence applies to them).
    if (profile?.employeeType === "office") {
      const offices = await db.select().from(officeLocations).where(and(eq(officeLocations.companyId, user.companyId), eq(officeLocations.isActive, true)));
      if (offices.length === 0) throw new Error("Belum ada lokasi kantor terdaftar — hubungi admin");

      let nearest = offices[0]!;
      let nearestDist = Infinity;
      for (const office of offices) {
        const d = haversineDistance(coords.latitude, coords.longitude, office.latitude, office.longitude);
        if (d < nearestDist) { nearestDist = d; nearest = office; }
      }
      if (nearestDist > nearest.radiusMeters) {
        throw new Error(`Terlalu jauh dari kantor "${nearest.name}" (${Math.round(nearestDist)}m). Maks ${nearest.radiusMeters}m`);
      }
      officeLocationId = nearest.id;
      distance = nearestDist;
    }

    const now = new Date();
    if (existing) {
      await db.update(attendance).set({
        checkinTime: now, checkinLat: coords.latitude, checkinLng: coords.longitude,
        checkinPhotoUrl: photoUrl, checkinDistanceMeters: distance, officeLocationId, updatedAt: now,
      }).where(eq(attendance.id, existing.id));
      return this.getById(existing.id);
    }

    const [row] = await db.insert(attendance).values({
      companyId: user.companyId, userId: user.id, date: today,
      checkinTime: now, checkinLat: coords.latitude, checkinLng: coords.longitude,
      checkinPhotoUrl: photoUrl, checkinDistanceMeters: distance, officeLocationId, status: "present",
    }).returning();
    return row;
  }

  async checkout(user: any, coords: { latitude: number; longitude: number }, photoUrl: string | null) {
    const today = new Date().toISOString().slice(0, 10);
    const [existing] = await db.select().from(attendance).where(and(eq(attendance.userId, user.id), eq(attendance.date, today)));
    if (!existing?.checkinTime) throw new Error("Belum check-in hari ini");
    if (existing.checkoutTime) throw new Error("Sudah check-out hari ini");

    const now = new Date();
    await db.update(attendance).set({
      checkoutTime: now, checkoutLat: coords.latitude, checkoutLng: coords.longitude,
      checkoutPhotoUrl: photoUrl, updatedAt: now,
    }).where(eq(attendance.id, existing.id));
    return this.getById(existing.id);
  }
}

export const attendanceService = new AttendanceService();
