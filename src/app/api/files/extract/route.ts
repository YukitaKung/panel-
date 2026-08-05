import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { resolveSafePath } from "@/lib/safe-path";

const MAX_ARCHIVE_SIZE = 50 * 1024 * 1024;
const MAX_ENTRIES = 10_000;
const MAX_ENTRY_SIZE = 100 * 1024 * 1024;
const MAX_EXTRACTED_SIZE = 1 * 1024 * 1024 * 1024;

function resolveArchiveEntry(basePath: string, entryName: string) {
  const normalized = entryName.replace(/\\/g, "/");
  if (!normalized || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) {
    throw new Error("Archive contains an unsafe path");
  }

  const targetPath = path.resolve(basePath, normalized);
  const relative = path.relative(basePath, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Archive contains a path outside the destination");
  }
  return targetPath;
}

async function assertNoSymlinkInPath(basePath: string, targetPath: string) {
  const relative = path.relative(basePath, targetPath);
  let currentPath = basePath;

  for (const part of relative.split(path.sep).filter(Boolean)) {
    currentPath = path.join(currentPath, part);
    try {
      if ((await fs.lstat(currentPath)).isSymbolicLink()) {
        throw new Error("Archive destination contains a symbolic link");
      }
    } catch (error: any) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
  }
}

export async function POST(request: Request) {
  try {
    const { path: archiveVirtualPath, destination } = await request.json();
    if (!archiveVirtualPath) {
      return NextResponse.json({ error: "Archive path is required" }, { status: 400 });
    }
    if (!String(archiveVirtualPath).toLowerCase().endsWith(".zip")) {
      return NextResponse.json({ error: "Only .zip files can be extracted" }, { status: 400 });
    }

    const archivePath = await resolveSafePath(archiveVirtualPath);
    const archiveStats = await fs.stat(archivePath);
    if (!archiveStats.isFile()) {
      return NextResponse.json({ error: "Archive is not a file" }, { status: 400 });
    }
    if (archiveStats.size > MAX_ARCHIVE_SIZE) {
      return NextResponse.json({ error: "Archive is too large (max 50MB)" }, { status: 413 });
    }

    const destinationPath = await resolveSafePath(
      destination || path.dirname(archivePath),
    );
    const archive = new AdmZip(archivePath);
    const entries = archive.getEntries();
    if (entries.length > MAX_ENTRIES) {
      return NextResponse.json({ error: "Archive contains too many files" }, { status: 413 });
    }

    let extractedSize = 0;
    let extractedFiles = 0;

    for (const entry of entries) {
      const targetPath = resolveArchiveEntry(destinationPath, entry.entryName);
      await assertNoSymlinkInPath(destinationPath, targetPath);

      if (entry.isDirectory || entry.entryName.endsWith("/")) {
        await fs.mkdir(targetPath, { recursive: true });
        continue;
      }

      if (entry.header.size > MAX_ENTRY_SIZE) {
        throw new Error(`Archive entry is too large: ${entry.entryName}`);
      }
      extractedSize += entry.header.size;
      if (extractedSize > MAX_EXTRACTED_SIZE) {
        throw new Error("Archive expands beyond the 1GB extraction limit");
      }

      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, entry.getData());
      extractedFiles += 1;
    }

    return NextResponse.json({
      success: true,
      files: extractedFiles,
      destination: destinationPath,
    });
  } catch (error: any) {
    console.error("ZIP extraction error:", error);
    return NextResponse.json({ error: error.message || "Failed to extract archive" }, { status: 500 });
  }
}
