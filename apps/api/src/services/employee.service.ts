import { db, users, employeeProfiles } from "@visitflow/db";
import { eq, and } from "drizzle-orm";


class EmployeeService {
  async list(user: any) {
    const conditions = [eq(employeeProfiles.companyId, user.companyId)];
    if (user.role === "manager") {
      if (!user.territoryId) return [];
      conditions.push(eq(users.territoryId, user.territoryId));
    }
    const rows = await db.select({
      profile: employeeProfiles,
      user: { id: users.id, email: users.email, fullName: users.fullName, phone: users.phone, role: users.role, isActive: users.isActive, territoryId: users.territoryId },
    }).from(employeeProfiles)
      .innerJoin(users, eq(employeeProfiles.userId, users.id))
      .where(and(...conditions));
    return rows.map((r) => ({ ...r.profile, user: r.user }));
  }

  async getById(id: string) {
    const [row] = await db.select({
      profile: employeeProfiles,
      user: { id: users.id, email: users.email, fullName: users.fullName, phone: users.phone, role: users.role, isActive: users.isActive, territoryId: users.territoryId },
    }).from(employeeProfiles)
      .innerJoin(users, eq(employeeProfiles.userId, users.id))
      .where(eq(employeeProfiles.id, id));
    if (!row) throw new Error("Employee not found");
    return { ...row.profile, user: row.user };
  }

  async getByUserId(userId: string) {
    const [row] = await db.select({
      profile: employeeProfiles,
      user: { id: users.id, email: users.email, fullName: users.fullName, phone: users.phone, role: users.role, isActive: users.isActive, territoryId: users.territoryId },
    }).from(employeeProfiles)
      .innerJoin(users, eq(employeeProfiles.userId, users.id))
      .where(eq(employeeProfiles.userId, userId));
    if (!row) throw new Error("Employee profile not found");
    return { ...row.profile, user: row.user };
  }

  // Creates both the login account and the HR profile in one step —
  // this is the "HR admin adds a new employee" flow. Role is restricted
  // to manager/agent; admin/super_admin accounts aren't provisioned here.
  async create(data: any, companyId: string) {
    const existing = await db.select().from(users).where(and(eq(users.companyId, companyId), eq(users.email, data.email)));
    if (existing.length > 0) throw new Error("Email already registered");

    const role = data.role === "manager" ? "manager" : "agent";
    const passwordHash = await Bun.password.hash(data.password, { algorithm: "argon2id" });
    const userId = crypto.randomUUID();

    await db.insert(users).values({
      id: userId, companyId, email: data.email, passwordHash,
      fullName: data.fullName, phone: data.phone || null, role,
      territoryId: data.territoryId || null,
    });

    const [profile] = await db.insert(employeeProfiles).values({
      companyId, userId,
      employeeType: data.employeeType === "office" ? "office" : "field",
      baseSalary: data.baseSalary || 0,
      bankName: data.bankName || null,
      bankAccountNumber: data.bankAccountNumber || null,
      bankAccountName: data.bankAccountName || null,
      taxStatus: data.taxStatus || "TK/0",
      npwp: data.npwp || null,
      bpjsKesehatanEnrolled: !!data.bpjsKesehatanEnrolled,
      bpjsKetenagakerjaanEnrolled: !!data.bpjsKetenagakerjaanEnrolled,
      joinDate: data.joinDate || new Date().toISOString().slice(0, 10),
    }).returning();

    return this.getById(profile!.id);
  }

  async update(id: string, data: any) {
    const [existing] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.id, id));
    if (!existing) throw new Error("Employee not found");

    const profileFields: any = {};
    for (const key of ["employeeType", "employmentStatus", "baseSalary", "bankName", "bankAccountNumber", "bankAccountName", "taxStatus", "npwp", "bpjsKesehatanEnrolled", "bpjsKetenagakerjaanEnrolled", "joinDate"]) {
      if (data[key] !== undefined) profileFields[key] = data[key];
    }
    if (Object.keys(profileFields).length > 0) {
      await db.update(employeeProfiles).set({ ...profileFields, updatedAt: new Date() }).where(eq(employeeProfiles.id, id));
    }

    const userFields: any = {};
    for (const key of ["fullName", "phone", "territoryId", "isActive"]) {
      if (data[key] !== undefined) userFields[key] = data[key];
    }
    if (Object.keys(userFields).length > 0) {
      await db.update(users).set({ ...userFields, updatedAt: new Date() }).where(eq(users.id, existing.userId));
    }

    return this.getById(id);
  }
}

export const employeeService = new EmployeeService();
