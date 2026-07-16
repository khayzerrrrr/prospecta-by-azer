import { db, users } from "@visitflow/db";
import { eq } from "drizzle-orm";

class AuthService {
  async register(data: { email: string; password: string; fullName: string; phone?: string }) {
    const existing = db.select().from(users).where(eq(users.email, data.email)).all();
    if (existing.length > 0) throw new Error("Email already registered");

    const passwordHash = await Bun.password.hash(data.password, { algorithm: "argon2id" });
    const id = crypto.randomUUID();

    db.insert(users).values({
      id, email: data.email, passwordHash, fullName: data.fullName, phone: data.phone, role: "agent",
    }).run();

    const user = db.select().from(users).where(eq(users.id, id)).get()!;
    const tokens = await this.generateTokens(user.id, user.email, user.fullName, user.role as any, user.territoryId, user.avatarUrl);
    db.update(users).set({ refreshToken: tokens.refreshToken, lastLoginAt: new Date() }).where(eq(users.id, id)).run();

    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role as any, territoryId: user.territoryId, avatarUrl: user.avatarUrl },
      tokens,
    };
  }

  async login(data: { email: string; password: string }) {
    const user = db.select().from(users).where(eq(users.email, data.email)).get();
    if (!user) throw new Error("Invalid email or password");
    if (!user.isActive) throw new Error("Account is deactivated");

    const valid = await Bun.password.verify(data.password, user.passwordHash);
    if (!valid) throw new Error("Invalid email or password");

    const tokens = await this.generateTokens(user.id, user.email, user.fullName, user.role as any, user.territoryId, user.avatarUrl);
    db.update(users).set({ refreshToken: tokens.refreshToken, lastLoginAt: new Date() }).where(eq(users.id, user.id)).run();

    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role as any, territoryId: user.territoryId, avatarUrl: user.avatarUrl },
      tokens,
    };
  }

  async me(userId: string) {
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) throw new Error("User not found");
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role as any, territoryId: user.territoryId, avatarUrl: user.avatarUrl };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new Error("Refresh token required");
    const user = db.select().from(users).where(eq(users.refreshToken, refreshToken)).get();
    if (!user) throw new Error("Invalid refresh token");
    if (!user.isActive) throw new Error("Account is deactivated");

    const tokens = await this.generateTokens(user.id, user.email, user.fullName, user.role as any, user.territoryId, user.avatarUrl);
    db.update(users).set({ refreshToken: tokens.refreshToken, lastLoginAt: new Date() }).where(eq(users.id, user.id)).run();

    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role as any, territoryId: user.territoryId, avatarUrl: user.avatarUrl },
      tokens,
    };
  }

  private async generateTokens(userId: string, email: string, fullName: string, role: string, territoryId: string | null, avatarUrl: string | null) {
    const { env } = await import("../config/env");
    const { signJwt } = await import("../utils/jwt");
    const accessToken = await signJwt({ sub: userId, email, fullName, role, territoryId, avatarUrl }, { expiresIn: env.JWT_ACCESS_EXPIRES });
    return { accessToken, refreshToken: crypto.randomUUID(), expiresIn: 900 };
  }
}

export const authService = new AuthService();
