import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const BASE_DIR = process.platform === "win32" ? "C:\\var\\www" : "/var/www";

function getSafePath(requestedPath: string) {
  const normalized = requestedPath.replace(/^[\/\\]+/, "");
  const resolved = path.resolve(BASE_DIR, normalized);
  if (!resolved.startsWith(BASE_DIR)) {
    throw new Error("Access Denied: Path is outside the allowed directory.");
  }
  return resolved;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const basePath = formData.get("basePath") as string;

    if (!file || !basePath) {
      return NextResponse.json({ error: "Missing file or basePath" }, { status: 400 });
    }

    const realBasePath = getSafePath(basePath);
    const fullRealPath = path.join(realBasePath, file.name);

    if (!fullRealPath.startsWith(BASE_DIR)) {
      throw new Error("Access Denied");
    }

    // Ensure base path exists
    try {
      await fs.access(realBasePath);
    } catch {
      await fs.mkdir(realBasePath, { recursive: true });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await fs.writeFile(fullRealPath, buffer);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
