import type { UserSession } from "@visitflow/shared";

type Permission = string;

const rolePermissions: Record<UserSession["role"], Permission[]> = {
  super_admin: ["*"],
  admin: [
    "users:read", "users:write",
    "leads:read", "leads:write", "leads:import",
    "visits:read", "visits:write", "visits:checkin",
    "pipeline:read", "pipeline:write", "pipeline:stages",
    "follow-ups:read", "follow-ups:write",
    "routes:read", "routes:write",
    "analytics:read",
    "territories:read", "territories:write",
    "settings:read", "settings:write",
  ],
  manager: [
    "leads:read", "leads:write", "leads:import",
    "visits:read", "visits:write", "visits:checkin",
    "pipeline:read", "pipeline:write",
    "follow-ups:read", "follow-ups:write",
    "routes:read", "routes:write",
    "analytics:read",
    "territories:read",
    "users:read",
  ],
  agent: [
    "leads:read", "leads:write",
    "visits:read", "visits:write", "visits:checkin",
    "pipeline:read",
    "follow-ups:read", "follow-ups:write",
    "routes:read", "routes:write",
    "analytics:read",
    "territories:read",
    "users:read",
  ],
};

export function requirePermission(permission: Permission) {
  return ({ user }: { user: UserSession }) => {
    if (user.role === "super_admin") return;
    const permissions = rolePermissions[user.role];
    if (!permissions || !permissions.includes(permission)) {
      throw new Error("Forbidden: insufficient permissions");
    }
  };
}

export function canAccessTeamData(user: UserSession, targetUserId?: string): boolean {
  if (["super_admin", "admin"].includes(user.role)) return true;
  if (user.role === "manager") return true; // Manager sees their team
  return targetUserId === user.id;
}
