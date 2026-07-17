import { db, kpiDefinitions, kpiScores, employeeProfiles, users } from "@visitflow/db";
import { eq, and, inArray, sql } from "drizzle-orm";

class KpiService {
  // ---- Definitions (HR-managed) ----
  async listDefinitions(companyId: string) {
    return db.select().from(kpiDefinitions).where(eq(kpiDefinitions.companyId, companyId));
  }

  async createDefinition(companyId: string, data: any) {
    const [row] = await db.insert(kpiDefinitions).values({
      companyId, name: data.name, description: data.description || null,
      unit: data.unit, targetValue: data.targetValue || 0,
      weight: data.weight ?? 100, appliesTo: data.appliesTo || "all",
    }).returning();
    return row;
  }

  async updateDefinition(id: string, data: any) {
    const fields: any = {};
    for (const key of ["name", "description", "unit", "targetValue", "weight", "appliesTo", "isActive"]) {
      if (data[key] !== undefined) fields[key] = data[key];
    }
    await db.update(kpiDefinitions).set({ ...fields, updatedAt: new Date() }).where(eq(kpiDefinitions.id, id));
    const [row] = await db.select().from(kpiDefinitions).where(eq(kpiDefinitions.id, id));
    return row;
  }

  // ---- Scores ----
  // Manager scoping mirrors the pattern used across employees/attendance:
  // territory-based, resolved via a join against users since employee_profiles
  // itself doesn't carry territoryId.
  async listScoresForPeriod(user: any, periodMonth: number, periodYear: number) {
    const conditions = [
      eq(kpiScores.companyId, user.companyId),
      eq(kpiScores.periodMonth, periodMonth),
      eq(kpiScores.periodYear, periodYear),
    ];
    if (user.role === "agent") {
      const [profile] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.userId, user.id));
      if (!profile) return [];
      conditions.push(eq(kpiScores.employeeProfileId, profile.id));
    } else if (user.role === "manager") {
      if (!user.territoryId) return [];
      const teammates = await db.select({ id: employeeProfiles.id }).from(employeeProfiles)
        .innerJoin(users, eq(employeeProfiles.userId, users.id))
        .where(eq(users.territoryId, user.territoryId));
      const ids = teammates.map((r) => r.id);
      conditions.push(ids.length > 0 ? inArray(kpiScores.employeeProfileId, ids) : sql`1=0`);
    }

    const rows = await db.select({
      score: kpiScores,
      definition: kpiDefinitions,
      user: { id: users.id, fullName: users.fullName, avatarUrl: users.avatarUrl },
    }).from(kpiScores)
      .innerJoin(kpiDefinitions, eq(kpiScores.kpiDefinitionId, kpiDefinitions.id))
      .innerJoin(employeeProfiles, eq(kpiScores.employeeProfileId, employeeProfiles.id))
      .innerJoin(users, eq(employeeProfiles.userId, users.id))
      .where(and(...conditions));
    return rows.map((r) => ({ ...r.score, definition: r.definition, user: r.user }));
  }

  async listEmployeeScores(employeeProfileId: string, periodMonth?: number, periodYear?: number) {
    const conditions = [eq(kpiScores.employeeProfileId, employeeProfileId)];
    if (periodMonth) conditions.push(eq(kpiScores.periodMonth, periodMonth));
    if (periodYear) conditions.push(eq(kpiScores.periodYear, periodYear));
    const rows = await db.select({
      score: kpiScores,
      definition: kpiDefinitions,
    }).from(kpiScores)
      .innerJoin(kpiDefinitions, eq(kpiScores.kpiDefinitionId, kpiDefinitions.id))
      .where(and(...conditions));
    return rows.map((r) => ({ ...r.score, definition: r.definition }));
  }

  // Overall score = weighted average of achievement% across all KPIs scored
  // for that employee/period. Achievement% is not capped, so over-target
  // performance still pulls the average up rather than plateauing at 100.
  async getEmployeeSummary(employeeProfileId: string, periodMonth: number, periodYear: number) {
    const scores = await this.listEmployeeScores(employeeProfileId, periodMonth, periodYear);
    const totalWeight = scores.reduce((s, r) => s + r.definition.weight, 0);
    const overallScore = totalWeight > 0
      ? scores.reduce((s, r) => s + r.achievementPercent * r.definition.weight, 0) / totalWeight
      : 0;
    return { scores, overallScore: Math.round(overallScore * 10) / 10 };
  }

  async upsertScore(companyId: string, scoredBy: string, data: any) {
    const [definition] = await db.select().from(kpiDefinitions).where(eq(kpiDefinitions.id, data.kpiDefinitionId));
    if (!definition) throw new Error("KPI definition not found");

    const targetValue = data.targetValue ?? definition.targetValue;
    const actualValue = data.actualValue || 0;
    const achievementPercent = targetValue > 0 ? Math.round((actualValue / targetValue) * 1000) / 10 : 0;

    const [existing] = await db.select().from(kpiScores).where(and(
      eq(kpiScores.employeeProfileId, data.employeeProfileId),
      eq(kpiScores.kpiDefinitionId, data.kpiDefinitionId),
      eq(kpiScores.periodMonth, data.periodMonth),
      eq(kpiScores.periodYear, data.periodYear),
    ));

    if (existing) {
      await db.update(kpiScores).set({
        targetValue, actualValue, achievementPercent, notes: data.notes || null, scoredBy, updatedAt: new Date(),
      }).where(eq(kpiScores.id, existing.id));
      return existing.id;
    }

    const [row] = await db.insert(kpiScores).values({
      companyId, employeeProfileId: data.employeeProfileId, kpiDefinitionId: data.kpiDefinitionId,
      periodMonth: data.periodMonth, periodYear: data.periodYear,
      targetValue, actualValue, achievementPercent, notes: data.notes || null, scoredBy,
    }).returning();
    return row!.id;
  }
}

export const kpiService = new KpiService();
