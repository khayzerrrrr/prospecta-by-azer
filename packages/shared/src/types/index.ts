export * from "./api";

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: "master_account" | "super_admin" | "admin" | "manager" | "agent";
  companyId: string | null;
  territoryId: string | null;
  avatarUrl: string | null;
  // Job title text, e.g. "Direktur Utama" — see packages/shared/constants/job-titles
  // for how this maps to a hierarchy-of-control access level.
  jobTitle: string | null;
  // Company's assigned industry (set once by master_account at provisioning).
  industry: string | null;
  // Employee's department — purely for dashboard content selection, not access.
  department: string | null;
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
