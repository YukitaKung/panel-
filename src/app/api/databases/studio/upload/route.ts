import { NextResponse } from "next/server";
import { isValidIdentifier, execAsync } from "@/lib/db-utils";
import fs from "fs/promises";
import path from "path";
import os from "os";

function normalizeMysqlDump(sql: string) {
  const textTypes = "(?:tiny|medium|long)?(?:text|blob)";
  const spatialTypes = "(?:geometry|point|linestring|polygon|multipoint|multilinestring|multipolygon|geometrycollection)";
  const column = "(?:`[^`]+`|[A-Za-z_][A-Za-z0-9_$]*)";
  const defaultValue = "(?:'(?:''|[^'])*'|NULL|CURRENT_TIMESTAMP(?:\\s*\\([^)]*\\))?|\\([^)]*\\)|[^\\s,]+)";
  const invalidDefault = new RegExp(
    `(\\s*${column}\\s+(?:${textTypes}|json|${spatialTypes})\\b[^,\\n]*?)\\s+DEFAULT\\s+${defaultValue}(?=\\s*(?:COMMENT\\b|,|$))`,
    "gim",
  );

  return sql.replace(invalidDefault, "$1");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string;
    const dbName = formData.get("dbName") as string;

    if (!file || !type || !dbName || !isValidIdentifier(dbName)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    if (!file.name.endsWith(".sql")) {
      return NextResponse.json({ error: "Only .sql files are allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Save to temp file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `upload-${Date.now()}-${Math.floor(Math.random() * 10000)}.sql`);
    const importFilePath = path.join(tempDir, `upload-${Date.now()}-${Math.floor(Math.random() * 10000)}-mysql8.sql`);
    await fs.writeFile(tempFilePath, buffer);

    try {
      if (type === "mysql") {
        const sql = buffer.toString("utf8");
        const normalizedSql = normalizeMysqlDump(sql);
        await fs.writeFile(importFilePath, normalizedSql, "utf8");
        await execAsync(`sudo mysql ${dbName} < ${importFilePath}`);
      } else if (type === "postgres") {
        await execAsync(`sudo -u postgres psql -d ${dbName} -f ${tempFilePath}`);
      } else {
        throw new Error("Unknown db type");
      }
    } finally {
      // Clean up
      await fs.unlink(tempFilePath).catch(() => {});
      await fs.unlink(importFilePath).catch(() => {});
    }

    return NextResponse.json({ success: true, message: "SQL file executed successfully." });
  } catch (error: any) {
    console.error("DB Studio Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
