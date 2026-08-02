import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const apiKey = await db.apiKey.findUnique({
      where: { key: token }
    });

    if (apiKey) {
      // Update last used timestamp
      await db.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() }
      });
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false });
  } catch (error) {
    return NextResponse.json({ valid: false, error: "Internal Server Error" }, { status: 500 });
  }
}
