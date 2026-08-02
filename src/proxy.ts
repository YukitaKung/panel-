import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "default_super_secret_key_for_hostpanel_123";
const key = new TextEncoder().encode(secretKey);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that don't require authentication
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/internal/verify-key" ||
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg)$/)
  ) {
    return NextResponse.next();
  }

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

  if (hasValidApiKey) {
    return NextResponse.next();
  }

  // 2. Fallback to Web Session Cookie
  const session = request.cookies.get("hostpanel_session")?.value;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ["HS256"],
    });

    if (!payload || !payload.userId) {
      throw new Error("Invalid payload");
    }

    return NextResponse.next();
  } catch (error) {
    // If token is invalid or expired
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("hostpanel_session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
