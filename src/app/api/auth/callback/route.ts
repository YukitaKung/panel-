import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";

const ALLOWED_USER_ID = "1031735724573212673";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=NoCode", request.url));
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || "http://157.254.192.58:5555/api/auth/callback";

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Discord credentials not configured" }, { status: 500 });
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token error:", tokenData);
      return NextResponse.redirect(new URL("/login?error=OAuthFailed", request.url));
    }

    // 2. Fetch user profile
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL("/login?error=ProfileFetchFailed", request.url));
    }

    // 3. Verify User ID
    if (userData.id !== ALLOWED_USER_ID) {
      console.log(`Unauthorized login attempt by Discord ID: ${userData.id} (${userData.username})`);
      return NextResponse.redirect(new URL("/login?error=Unauthorized", request.url));
    }

    // 4. Success! Create session
    await setSession(userData.id);

    // 5. Redirect to Dashboard
    return NextResponse.redirect(new URL("/", request.url));

  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(new URL("/login?error=InternalError", request.url));
  }
}
