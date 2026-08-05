import { NextResponse } from "next/server";
import { execAsync, isValidIdentifier, escapeSqlString } from "@/lib/db-utils";

export async function GET() {
  try {
    // Show databases, excluding system databases
    const { stdout } = await execAsync(`sudo mysql -e "SHOW DATABASES;"`);
    
    // Parse the output (it's tabular text)
    const lines = stdout.trim().split("\n").map(l => l.trim()).filter(Boolean);
    const dbNames = lines.slice(1); // skip header "Database"
    
    const systemDbs = ["information_schema", "mysql", "performance_schema", "sys"];
    const userDbs = dbNames.filter(db => !systemDbs.includes(db));
    
    // Fetch tags from local DB
    const { db } = await import("@/lib/db");
    const dbTags = await db.databaseTag.findMany({ where: { engine: "mysql" } });
    const tagMap = new Map(dbTags.map(t => [t.dbName, JSON.parse(t.tags || "[]")]));

    // Get users for each DB (Heuristic: users with permissions to the DB)
    const dbs = await Promise.all(userDbs.map(async (dbName) => {
      try {
        const { stdout: sizeStdout } = await execAsync(`sudo mysql -e "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) FROM information_schema.tables WHERE table_schema = '${dbName}';"`);
        const sizeLines = sizeStdout.trim().split("\n");
        const sizeMb = sizeLines.length > 1 ? parseFloat(sizeLines[1]) || 0 : 0;
        
        return { name: dbName, type: "mysql", sizeMb, user: "auto", tags: tagMap.get(dbName) || [] };
      } catch {
        return { name: dbName, type: "mysql", sizeMb: 0, user: "unknown", tags: tagMap.get(dbName) || [] };
      }
    }));

    return NextResponse.json(dbs);
  } catch (error: any) {
    console.error("MySQL GET Error:", error);
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
    const tmpFile = `/tmp/mysql_create_${Date.now()}_${Math.random().toString(36).substring(7)}.sql`;
    const query = `
      CREATE DATABASE \`${dbName}\`;
      CREATE USER IF NOT EXISTS \`${dbUser}\`@'localhost' IDENTIFIED BY '${escapedPassword}';
      GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO \`${dbUser}\`@'localhost';
      FLUSH PRIVILEGES;
    `;
    
    const fs = require('fs/promises');
    await fs.writeFile(tmpFile, query, { mode: 0o600 });
    
    try {
      await execAsync(`sudo mysql < ${tmpFile}`);
    } finally {
      await fs.unlink(tmpFile).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("MySQL POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { dbName } = await request.json();

    if (!isValidIdentifier(dbName)) {
      return NextResponse.json({ error: "Invalid database name" }, { status: 400 });
    }

    await execAsync('sudo mysql -e "DROP DATABASE IF EXISTS \\`' + dbName + '\\`;"');
    // We assume the username is the same as the dbName for this panel, or we can just leave the user.
    // Let's drop the user with the same name if it exists.
    try {
      await execAsync('sudo mysql -e "DROP USER \\`' + dbName + '\\`@\'localhost\';"');
    } catch (e) {
      // Ignore if user doesn't exist
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("MySQL DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
