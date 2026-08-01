import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// To limit reading huge files which could crash the server/browser
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const BASE_DIR = process.platform === "win32" ? "C:\\var\\www" : "/var/www";

function getSafePath(requestedPath: string) {
  const normalized = requestedPath.replace(/^[\/\\]+/, "");
  const resolved = path.resolve(BASE_DIR, normalized);
  if (!resolved.startsWith(BASE_DIR)) {
    throw new Error("Access Denied: Path is outside the allowed directory.");
  }
  return resolved;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const virtualPath = searchParams.get("path");

  if (!virtualPath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  try {
    const realPath = getSafePath(virtualPath);
    const stats = await fs.stat(realPath);
    
    if (stats.isDirectory()) {
      return NextResponse.json({ error: "Cannot read a directory as a file" }, { status: 400 });
    }
    
    if (stats.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File is too large to open in the browser (Max 5MB)" }, { status: 400 });
    }

    const content = await fs.readFile(realPath, "utf-8");
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Error reading file:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { path: virtualPath, content } = await request.json();
    
    if (!virtualPath || content === undefined) {
      return NextResponse.json({ error: "Missing path or content" }, { status: 400 });
    }

    const realPath = getSafePath(virtualPath);
    await fs.writeFile(realPath, content, "utf-8");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error writing file:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
