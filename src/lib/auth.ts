import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const secretKey = process.env.JWT_SECRET || "default_super_secret_key_for_hostpanel_123";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("hostpanel_session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function setSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ userId, expires });
  
  const cookieStore = await cookies();
  cookieStore.set("hostpanel_session", session, {
    expires,
    httpOnly: true,
    secure: false, // Set to false temporarily since we are using HTTP (IP:Port)
    sameSite: "lax",
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("hostpanel_session");
}

export async function verifyApiRequest(request: Request): Promise<boolean> {
  // 1. Check for API Key in Authorization header (Bearer token)
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    
    // Find key in database
    const apiKey = await db.apiKey.findUnique({
      where: { key: token }
    });

    if (apiKey) {
      // Update last used timestamp (fire and forget)
      db.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() }
      }).catch(console.error);
      
      return true;
    }
  }

  // 2. Fallback to checking Web Session Cookie
  const session = await getSession();
  if (session && session.userId) {
    return true;
  }

  // Unauthorized
  return false;
}
