import { db, users } from "@visitflow/db";
import { eq, and } from "drizzle-orm";

type UserRow = typeof users.$inferSelect;

class AuthService {
  async register(data: { email: string; password: string; fullName: string; phone?: string }, companyId: string) {
    const existing = await db.select().from(users).where(and(eq(users.companyId, companyId), eq(users.email, data.email)));
    if (existing.length > 0) throw new Error("Email already registered");

    const passwordHash = await Bun.password.hash(data.password, { algorithm: "argon2id" });
    const id = crypto.randomUUID();

    await db.insert(users).values({
      id, companyId, email: data.email, passwordHash, fullName: data.fullName, phone: data.phone, role: "agent",
    });

    const [user] = await db.select().from(users).where(eq(users.id, id));
    const tokens = await this.generateTokens(user!);
    await db.update(users).set({ refreshToken: tokens.refreshToken, lastLoginAt: new Date() }).where(eq(users.id, id));

    return { user: this.toSession(user!), tokens };
  }

  async login(data: { email: string; password: string }, companyId: string) {
    const [user] = await db.select().from(users).where(and(eq(users.companyId, companyId), eq(users.email, data.email)));
    if (!user) throw new Error("Invalid email or password");
    if (!user.isActive) throw new Error("Account is deactivated");

    const valid = await Bun.password.verify(data.password, user.passwordHash);
    if (!valid) throw new Error("Invalid email or password");

    const tokens = await this.generateTokens(user);
    await db.update(users).set({ refreshToken: tokens.refreshToken, lastLoginAt: new Date() }).where(eq(users.id, user.id));

    return { user: this.toSession(user), tokens };
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

    const tokens = await this.generateTokens(user);
    await db.update(users).set({ refreshToken: tokens.refreshToken, lastLoginAt: new Date() }).where(eq(users.id, user.id));

    return { user: this.toSession(user), tokens };
  }

  private toSession(user: UserRow) {
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role as any, companyId: user.companyId, territoryId: user.territoryId, avatarUrl: user.avatarUrl };
  }

  private async generateTokens(user: UserRow) {
    const { env } = await import("../config/env");
    const { signJwt } = await import("../utils/jwt");
    const accessToken = await signJwt(
      { sub: user.id, email: user.email, fullName: user.fullName, role: user.role, companyId: user.companyId, territoryId: user.territoryId, avatarUrl: user.avatarUrl },
      { expiresIn: env.JWT_ACCESS_EXPIRES },
    );
    return { accessToken, refreshToken: crypto.randomUUID(), expiresIn: 900 };
  }
}

export const authService = new AuthService();
