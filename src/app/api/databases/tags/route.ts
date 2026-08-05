import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const { dbName, engine, tags } = await request.json();

    if (!dbName || !engine) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Upsert the tags
    const result = await db.databaseTag.upsert({
      where: {
        dbName_engine: {
          dbName,
          engine
        }
      },
      update: {
        tags: JSON.stringify(tags || [])
      },
      create: {
        dbName,
        engine,
        tags: JSON.stringify(tags || [])
      }
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Tags PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
