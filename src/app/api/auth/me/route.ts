import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        username: session.username || "Admin",
        avatarUrl: session.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
