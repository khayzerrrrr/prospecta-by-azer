import { db, users, companies, employeeProfiles } from "@visitflow/db";
import { eq, and } from "drizzle-orm";

type UserRow = typeof users.$inferSelect;

class AuthService {
  async register(data: { email: string; password: string; fullName: string; phone?: string }, companyId: string, role: UserRow["role"] = "agent") {
    const existing = await db.select().from(users).where(and(eq(users.companyId, companyId), eq(users.email, data.email)));
    if (existing.length > 0) throw new Error("Email already registered");

    const passwordHash = await Bun.password.hash(data.password, { algorithm: "argon2id" });
    const id = crypto.randomUUID();

    await db.insert(users).values({
      id, companyId, email: data.email, passwordHash, fullName: data.fullName, phone: data.phone, role,
    });

    const [user] = await db.select().from(users).where(eq(users.id, id));
    const session = await this.toSession(user!);
    const tokens = await this.generateTokens(session);
    await db.update(users).set({ refreshToken: tokens.refreshToken, lastLoginAt: new Date() }).where(eq(users.id, id));

    return { user: session, tokens };
  }

  async login(data: { email: string; password: string }, companyId: string) {
    let [user] = await db.select().from(users).where(and(eq(users.companyId, companyId), eq(users.email, data.email)));
    // master_account is platform-wide, not scoped to whatever tenant the
    // subdomain/header happened to resolve to — fall back to a
    // company-agnostic lookup so it can log in from any context.
    if (!user) {
      [user] = await db.select().from(users).where(and(eq(users.email, data.email), eq(users.role, "master_account")));
    }
    if (!user) throw new Error("Invalid email or password");
    if (!user.isActive) throw new Error("Account is deactivated");

    const valid = await Bun.password.verify(data.password, user.passwordHash);
    if (!valid) throw new Error("Invalid email or password");

    const session = await this.toSession(user);
    const tokens = await this.generateTokens(session);
    await db.update(users).set({ refreshToken: tokens.refreshToken, lastLoginAt: new Date() }).where(eq(users.id, user.id));

    return { user: session, tokens };
  }

  // Issues a fresh session+tokens for an already-created user — used by the
  // company-claim signup flow (company.service.ts) to auto-login the newly
  // registered super_admin without a separate login round-trip.
  async issueSession(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");
    const session = await this.toSession(user);
    const tokens = await this.generateTokens(session);
    await db.update(users).set({ refreshToken: tokens.refreshToken, lastLoginAt: new Date() }).where(eq(users.id, userId));
    return { user: session, tokens };
  }

  async updatePhoto(userId: string, photo: string) {
    await db.update(users).set({ avatarUrl: photo, updatedAt: new Date() }).where(eq(users.id, userId));
    return this.me(userId);
  }

  async me(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");
    return this.toSession(user);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new Error("Refresh token required");
    const [user] = await db.select().from(users).where(eq(users.refreshToken, refreshToken));
    if (!user) throw new Error("Invalid refresh token");
    if (!user.isActive) throw new Error("Account is deactivated");

    const session = await this.toSession(user);
    const tokens = await this.generateTokens(session);
    await db.update(users).set({ refreshToken: tokens.refreshToken, lastLoginAt: new Date() }).where(eq(users.id, user.id));

    return { user: session, tokens };
  }

  // Resolves the two extra fields that don't live on `users` directly:
  // the company's fixed industry, and this user's HR-assigned department
  // (if they have an employee_profiles row — not everyone does, e.g.
  // master_account or a freshly-claimed super_admin).
  private async toSession(user: UserRow) {
    const [company] = user.companyId
      ? await db.select({ industry: companies.industry }).from(companies).where(eq(companies.id, user.companyId))
      : [];
    const [profile] = await db.select({ department: employeeProfiles.department }).from(employeeProfiles).where(eq(employeeProfiles.userId, user.id));
    return {
      id: user.id, email: user.email, fullName: user.fullName, role: user.role as any,
      companyId: user.companyId, territoryId: user.territoryId, avatarUrl: user.avatarUrl,
      jobTitle: user.jobTitle, industry: company?.industry ?? null, department: profile?.department ?? null,
    };
  }

  private async generateTokens(session: Awaited<ReturnType<AuthService["toSession"]>>) {
    const { env } = await import("../config/env");
    const { signJwt } = await import("../utils/jwt");
    const accessToken = await signJwt(
      {
        sub: session.id, email: session.email, fullName: session.fullName, role: session.role,
        companyId: session.companyId, territoryId: session.territoryId, avatarUrl: session.avatarUrl,
        jobTitle: session.jobTitle, industry: session.industry, department: session.department,
      },
      { expiresIn: env.JWT_ACCESS_EXPIRES },
    );
    return { accessToken, refreshToken: crypto.randomUUID(), expiresIn: 900 };
  }
}

export const authService = new AuthService();
