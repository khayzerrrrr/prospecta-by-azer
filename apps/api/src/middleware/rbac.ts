import type { UserSession } from "@visitflow/shared";
import { ForbiddenError } from "../utils/errors";

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
      throw new ForbiddenError("Forbidden: insufficient permissions");
    }
  };
}

export interface OwnedRecord {
  ownerId?: string | null;
  territoryId?: string | null;
}

// Manager scoping is territory-based rather than a real reports-to hierarchy,
// since the data model has no manager->agent relation. Records that don't
// carry their own territoryId (visits/deals) resolve it via a join at the
// call site before reaching this function.
export function canAccessRecord(user: UserSession, record: OwnedRecord): boolean {
  if (user.role === "super_admin" || user.role === "admin") return true;
  if (user.role === "manager") {
    return !!record.territoryId && !!user.territoryId && record.territoryId === user.territoryId;
  }
  return record.ownerId === user.id;
}
