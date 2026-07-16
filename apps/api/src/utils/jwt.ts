import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function signJwt(payload: Record<string, unknown>, options?: { expiresIn?: string }): Promise<string> {
  const expiresIn = options?.expiresIn || env.JWT_ACCESS_EXPIRES;

  let jwt = new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt();

  const now = Math.floor(Date.now() / 1000);
  if (expiresIn.endsWith("m")) {
    jwt = jwt.setExpirationTime(now + parseInt(expiresIn) * 60);
  } else if (expiresIn.endsWith("d")) {
    jwt = jwt.setExpirationTime(now + parseInt(expiresIn) * 86400);
  } else if (expiresIn.endsWith("h")) {
    jwt = jwt.setExpirationTime(now + parseInt(expiresIn) * 3600);
  } else {
    jwt = jwt.setExpirationTime(now + 900); // default 15 min
  }

  return jwt.sign(secret);
}

export async function verifyJwt(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
