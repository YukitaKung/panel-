import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { BASE_DIR, resolveSafePath } from "@/lib/safe-path";

function toVirtualPath(realPath: string) {
  if (realPath === BASE_DIR) return "/";
  // Extract the part after BASE_DIR
  let virtual = realPath.substring(BASE_DIR.length);
  // Replace windows backslashes with forward slashes for UI consistency
  virtual = virtual.replace(/\\/g, "/");
  if (!virtual.startsWith("/")) virtual = "/" + virtual;
  return virtual;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const virtualPath = searchParams.get("path") || "/";

  try {
    const realDirPath = await resolveSafePath(virtualPath);
    
    // Ensure BASE_DIR exists
    try {
      await fs.access(BASE_DIR);
    } catch {
      await fs.mkdir(BASE_DIR, { recursive: true });
    }

    const items = await fs.readdir(realDirPath, { withFileTypes: true });
    const formattedItems = await Promise.all(
      items.map(async (item) => {
        const fullRealPath = path.join(realDirPath, item.name);
        try {
          const stats = await fs.stat(fullRealPath);
          return {
            name: item.name,
            path: toVirtualPath(fullRealPath),
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

    const realBasePath = await resolveSafePath(basePath);
    const fullRealPath = await resolveSafePath(path.join(realBasePath, name), true);

    if (isDirectory) {
      await fs.mkdir(fullRealPath, { recursive: true });
    } else {
      await fs.writeFile(fullRealPath, "", "utf-8"); // Empty file
    }

    return NextResponse.json({ success: true, path: toVirtualPath(fullRealPath) });
  } catch (error: any) {
    console.error("Error creating file/folder:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { targetPath } = await request.json();
    if (!targetPath || targetPath === "/") {
      return NextResponse.json({ error: "Cannot delete root directory" }, { status: 400 });
    }

    const realTargetPath = await resolveSafePath(targetPath);
    await fs.rm(realTargetPath, { recursive: true, force: true });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
