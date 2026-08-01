import { NextResponse } from "next/server";
import { isValidIdentifier, execAsync } from "@/lib/db-utils";
import fs from "fs/promises";
import path from "path";
import os from "os";

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
    await fs.writeFile(tempFilePath, buffer);

    try {
      if (type === "mysql") {
        await execAsync(`sudo mysql ${dbName} < ${tempFilePath}`);
      } else if (type === "postgres") {
        await execAsync(`sudo -u postgres psql -d ${dbName} -f ${tempFilePath}`);
      } else {
        throw new Error("Unknown db type");
      }
    } finally {
      // Clean up
      await fs.unlink(tempFilePath).catch(() => {});
    }

    return NextResponse.json({ success: true, message: "SQL file executed successfully." });
  } catch (error: any) {
    console.error("DB Studio Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
