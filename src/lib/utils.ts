import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function escapeShellArg(arg: string) {
  if (!arg) return "''";
  // Enclose the argument in single quotes and replace single quotes inside with '\''
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
