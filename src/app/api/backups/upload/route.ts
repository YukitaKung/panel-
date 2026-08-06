import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/db";

const BACKUP_DIR = "/var/www/backups";
const MAX_UPLOAD_SIZE = 1024 * 1024 * 1024;

function isSupportedBackup(name: string) {
  const lower = name.toLowerCase();
  return lower.endsWith(".tar.gz") || lower.endsWith(".tgz");
}

export async function POST(request: Request) {
  let tempPath = "";
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !isSupportedBackup(file.name)) {
      return NextResponse.json({ error: "Only .tar.gz or .tgz backups are supported" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: "Backup is too large (max 1GB)" }, { status: 413 });
    }

    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const originalName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "-");
    const filename = `uploaded-${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${originalName}`;
    const fullPath = path.join(BACKUP_DIR, filename);
    tempPath = path.join(BACKUP_DIR, `.upload-${crypto.randomUUID()}.tmp`);

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length < 2 || buffer[0] !== 0x1f || buffer[1] !== 0x8b) {
      return NextResponse.json({ error: "The uploaded file is not a valid gzip archive" }, { status: 400 });
    }

    await fs.writeFile(tempPath, buffer, { mode: 0o640 });
    await fs.rename(tempPath, fullPath);
    tempPath = "";

    const size = `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`;
    const backup = await db.backup.create({
      data: {
        name: filename,
        type: originalName.startsWith("migration-") ? "Migration" : "Uploaded",
        size,
        status: "Completed",
        path: fullPath,
      },
    });

    return NextResponse.json({ success: true, backup });
  } catch (error: any) {
    if (tempPath) await fs.unlink(tempPath).catch(() => {});
    console.error("Backup upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload backup" }, { status: 500 });
  }
}
