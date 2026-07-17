export * from "./api";

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: "master_account" | "super_admin" | "admin" | "manager" | "agent";
  companyId: string | null;
  territoryId: string | null;
  avatarUrl: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}
