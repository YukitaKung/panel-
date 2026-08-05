import { promises as fs } from "fs";
import path from "path";

export const BASE_DIR = process.platform === "win32" ? "C:\\var\\www" : "/var/www";

function assertInsideBase(base: string, candidate: string) {
  const relative = path.relative(base, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Access Denied: Path is outside the allowed directory.");
  }
}

export async function resolveSafePath(requestedPath: string, allowMissing = false) {
  const normalized = requestedPath.startsWith(BASE_DIR)
    ? requestedPath
    : requestedPath.replace(/^[\\/]+/, "");
  const resolved = path.resolve(BASE_DIR, normalized);
  assertInsideBase(BASE_DIR, resolved);

  const realBase = await fs.realpath(BASE_DIR);
  let realCandidate: string;
  try {
    realCandidate = await fs.realpath(resolved);
  } catch (error) {
    if (!allowMissing) throw error;
    realCandidate = await fs.realpath(path.dirname(resolved));
  }
  assertInsideBase(realBase, realCandidate);

  return resolved;
}
