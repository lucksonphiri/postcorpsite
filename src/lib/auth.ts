import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "development-secret-change-me");
export type Session = { id: number; email: string; name: string; role: string };
export async function signSession(data: Session) { return new SignJWT(data).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret); }
export async function getSession(): Promise<Session | null> {
  try { const store = await cookies(); const token = store.get("postcorp_session")?.value; if (!token) return null; return (await jwtVerify(token, secret)).payload as unknown as Session; } catch { return null; }
}
