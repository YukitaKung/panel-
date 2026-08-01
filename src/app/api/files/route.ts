import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dirPath = searchParams.get("path") || "/";

  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const formattedItems = await Promise.all(
      items.map(async (item) => {
        const fullPath = path.join(dirPath, item.name);
        try {
          const stats = await fs.stat(fullPath);
          return {
            name: item.name,
            path: fullPath,
            isDirectory: item.isDirectory(),
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
          };
        } catch (err) {
          return null; // Skip if permissions error or broken symlink
        }
      })
    );

    // Filter nulls and sort: Directories first, then alphabetical
    const result = formattedItems
      .filter((item) => item !== null)
      .sort((a, b) => {
        if (a!.isDirectory === b!.isDirectory) {
          return a!.name.localeCompare(b!.name);
        }
        return a!.isDirectory ? -1 : 1;
      });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error reading directory:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { basePath, name, isDirectory } = await request.json();
    if (!basePath || !name) {
      return NextResponse.json({ error: "Missing basePath or name" }, { status: 400 });
    }

    const fullPath = path.join(basePath, name);

    if (isDirectory) {
      await fs.mkdir(fullPath, { recursive: true });
    } else {
      await fs.writeFile(fullPath, "", "utf-8"); // Empty file
    }

    return NextResponse.json({ success: true, path: fullPath });
  } catch (error: any) {
    console.error("Error creating file/folder:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { targetPath } = await request.json();
    if (!targetPath || targetPath === "/") {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    await fs.rm(targetPath, { recursive: true, force: true });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
