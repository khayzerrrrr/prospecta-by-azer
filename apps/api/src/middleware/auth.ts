import { verifyJwt } from "../utils/jwt";
import type { UserSession } from "@visitflow/shared";

export async function getAuthUser(request: Request, cookie?: any): Promise<UserSession> {
  let token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token && cookie) {
    token = cookie.access_token?.value as string | undefined;
  }

  if (!token) throw new Error("Unauthorized");

  const payload = await verifyJwt(token);
  if (!payload) throw new Error("Invalid token");

  return {
    id: payload.sub as string,
    email: payload.email as string,
    fullName: payload.fullName as string,
    role: payload.role as UserSession["role"],
    territoryId: (payload.territoryId as string) || null,
    avatarUrl: (payload.avatarUrl as string) || null,
  };
}
