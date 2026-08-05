import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { resolveSafePath } from "@/lib/safe-path";

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const basePath = formData.get("basePath") as string;

    if (!file || !basePath) {
      return NextResponse.json({ error: "Missing file or basePath" }, { status: 400 });
    }

    const realBasePath = await resolveSafePath(basePath);
    const safeFileName = path.basename(file.name);
    if (!safeFileName || safeFileName === "." || safeFileName === "..") {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
    }
    const fullRealPath = await resolveSafePath(path.join(realBasePath, safeFileName), true);

    // Ensure base path exists
    try {
      await fs.access(realBasePath);
    } catch {
      await fs.mkdir(realBasePath, { recursive: true });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: "File is too large (max 50MB)" }, { status: 413 });
    }
    const buffer = Buffer.from(bytes);
    
    await fs.writeFile(fullRealPath, buffer);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
