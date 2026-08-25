import { jwtVerify, SignJWT } from "jose";

export type AuthTokenPayload = {
  sub: string;
  username: string;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  const username =
    typeof payload.username === "string" ? payload.username : "";
  if (!sub || !username) {
    throw new Error("Invalid token");
  }
  return { sub, username } satisfies AuthTokenPayload;
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}
