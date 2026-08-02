import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "default_super_secret_key_for_hostpanel_123";
const key = new TextEncoder().encode(secretKey);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip auth for these exact paths
  const publicPaths = [
    "/api/auth/discord",
    "/api/auth/callback",
    "/api/internal/verify-key"
  ];

  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  let hasValidSession = false;
  let hasValidApiKey = false;

  // 1. Check for API Key in Authorization header (Bearer token)
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    
    // Call internal verification endpoint
    const url = new URL("/api/internal/verify-key", request.url);
    try {
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (data.valid) {
        hasValidApiKey = true;
      }
    } catch (e) {
      console.error("Failed to verify API key via internal route", e);
    }
  }

  // 2. Check Web Session Cookie
  if (!hasValidApiKey) {
    const sessionCookie = request.cookies.get("hostpanel_session")?.value;
    if (sessionCookie) {
      try {
        const { payload } = await jwtVerify(sessionCookie, key, {
          algorithms: ["HS256"],
        });
        if (payload && payload.userId) {
          hasValidSession = true;
        }
      } catch (e) {
        // Invalid token
      }
    }
  }

  // If no session and no valid Bearer token, reject
  if (!hasValidSession && !hasValidApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
