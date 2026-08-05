import { createHash } from "node:crypto";
import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const db = new PrismaClient({ adapter });

function hashApiKey(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

try {
  const keys = await db.apiKey.findMany({ select: { id: true, key: true } });
  let migrated = 0;

  for (const apiKey of keys) {
    if (/^[a-f0-9]{64}$/i.test(apiKey.key)) continue;
    await db.apiKey.update({
      where: { id: apiKey.id },
      data: { key: hashApiKey(apiKey.key) },
    });
    migrated += 1;
  }

  console.log(`api-keys-migrated=${migrated}`);
} finally {
  await db.$disconnect();
}
