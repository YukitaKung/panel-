import { NextResponse } from "next/server";
import { execAsync, isValidIdentifier, escapeSqlString } from "@/lib/db-utils";

export async function GET() {
  try {
    // Show postgres databases
    const { stdout } = await execAsync(`sudo -u postgres psql -t -c "SELECT datname, pg_size_pretty(pg_database_size(datname)), pg_get_userbyid(datdba) FROM pg_database WHERE datistemplate = false;"`);
    
    // Fetch tags from local DB
    const { db } = await import("@/lib/db");
    const dbTags = await db.databaseTag.findMany({ where: { engine: "postgres" } });
    const tagMap = new Map(dbTags.map(t => [t.dbName, JSON.parse(t.tags || "[]")]));

    const lines = stdout.trim().split("\n").filter(Boolean);
    const dbs = lines.map(line => {
      const parts = line.split("|").map(s => s.trim());
      if (parts.length >= 3) {
        const name = parts[0];
        const sizeStr = parts[1];
        const user = parts[2];
        
        // Skip default postgres db
        if (name === "postgres") return null;
        
        let sizeMb = 0;
        if (sizeStr.includes("MB")) sizeMb = parseFloat(sizeStr);
        if (sizeStr.includes("GB")) sizeMb = parseFloat(sizeStr) * 1024;
        if (sizeStr.includes("kB")) sizeMb = parseFloat(sizeStr) / 1024;
        
        return { name, type: "postgres", sizeMb, user, tags: tagMap.get(name) || [] };
      }
      return null;
    }).filter(Boolean);

    return NextResponse.json(dbs);
  } catch (error: any) {
    console.error("Postgres GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { dbName, dbUser, dbPassword } = await request.json();

    if (!isValidIdentifier(dbName) || !isValidIdentifier(dbUser) || !dbPassword) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const escapedPassword = escapeSqlString(dbPassword);

    // Securely write query to a temporary file to prevent Bash command injection
    const tmpFile = `/tmp/pg_create_${Date.now()}_${Math.random().toString(36).substring(7)}.sql`;
    
    // PostgreSQL block to handle role creation or password update if it exists
    const query = `
      DO
      $do$
      BEGIN
        IF NOT EXISTS (
            SELECT FROM pg_catalog.pg_roles
            WHERE  rolname = '${dbUser}') THEN
            CREATE ROLE "${dbUser}" WITH LOGIN PASSWORD '${escapedPassword}';
        ELSE
            ALTER ROLE "${dbUser}" WITH PASSWORD '${escapedPassword}';
        END IF;
      END
      $do$;
      CREATE DATABASE "${dbName}" OWNER "${dbUser}";
    `;
    
    const fs = require('fs/promises');
    await fs.writeFile(tmpFile, query, { mode: 0o600 });
    
    try {
      await execAsync(`sudo -u postgres psql -f ${tmpFile}`);
    } finally {
      await fs.unlink(tmpFile).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Postgres POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { dbName } = await request.json();

    if (!isValidIdentifier(dbName)) {
      return NextResponse.json({ error: "Invalid database name" }, { status: 400 });
    }

    await execAsync(`sudo -u postgres psql -c "DROP DATABASE IF EXISTS \\"${dbName}\\";"`);
    
    // We assume the username is the same as the dbName for this panel
    try {
      await execAsync(`sudo -u postgres psql -c "DROP ROLE IF EXISTS \\"${dbName}\\";"`);
    } catch (e) {
      // Ignore
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Postgres DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
