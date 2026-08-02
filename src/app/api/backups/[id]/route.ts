import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";

const execAsync = promisify(exec);

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backup = await db.backup.findUnique({ where: { id } });

    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    // Delete file
    try {
      await fs.unlink(backup.path);
    } catch (err: any) {
      console.warn("Could not delete backup file:", err.message);
    }

    // Delete DB record
    await db.backup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to delete backup" }, { status: 500 });
  }
}
