import { exec } from "child_process";
import { promisify } from "util";

export const execAsync = promisify(exec);

export function isValidIdentifier(name: string) {
  // Only allow alphanumeric and underscore, max 64 chars
  return /^[a-zA-Z0-9_]{1,64}$/.test(name);
}

export function escapeSqlString(str: string) {
  // Basic escaping for single quotes in passwords for SQL commands
  return str.replace(/'/g, "''");
}
