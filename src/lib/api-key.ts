import { createHash } from "crypto";

export function hashApiKey(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function isHashedApiKey(value: string) {
  return /^[a-f0-9]{64}$/i.test(value);
}
