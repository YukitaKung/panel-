import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const host = request.headers.get("host") || "157.20.83.170:5555";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "http"; // Change to https if panel uses SSL in future
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${protocol}://${host}/api/auth/callback`;
  
  if (!clientId) {
    return NextResponse.json({ error: "Discord Client ID is not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    prompt: "consent",
  });

  return NextResponse.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
}
