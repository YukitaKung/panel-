import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  try {
    const keys = await db.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json(keys);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate a secure API key
    const rawKey = crypto.randomBytes(32).toString('hex');
    const key = `sk_live_${rawKey}`;

    const apiKey = await db.apiKey.create({
      data: {
        name,
        key
      }
    });

    return NextResponse.json(apiKey);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await db.apiKey.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
