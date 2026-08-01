import { NextResponse } from "next/server";
import { promises as fs } from "fs";

// To limit reading huge files which could crash the server/browser
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  try {
    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory()) {
      return NextResponse.json({ error: "Cannot read a directory as a file" }, { status: 400 });
    }
    
    if (stats.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File is too large to open in the browser (Max 5MB)" }, { status: 400 });
    }

    const content = await fs.readFile(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Error reading file:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { path, content } = await request.json();
    
    if (!path || content === undefined) {
      return NextResponse.json({ error: "Missing path or content" }, { status: 400 });
    }

    await fs.writeFile(path, content, "utf-8");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error writing file:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
