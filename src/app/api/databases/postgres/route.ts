import { NextResponse } from "next/server";
import { execAsync, isValidIdentifier, escapeSqlString } from "@/lib/db-utils";

export async function GET() {
  try {
    // Show postgres databases
    const { stdout } = await execAsync(`sudo -u postgres psql -t -c "SELECT datname, pg_size_pretty(pg_database_size(datname)), pg_get_userbyid(datdba) FROM pg_database WHERE datistemplate = false;"`);
    
    // Parse the output
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
        
        return { name, type: "postgres", sizeMb, user };
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

    // PostgreSQL requires user to be created first, then db owner assigned
    // We cannot easily use CREATE ROLE IF NOT EXISTS in all versions, so we try and ignore error
    try {
      await execAsync(`sudo -u postgres psql -c "CREATE ROLE \\"${dbUser}\\" WITH LOGIN PASSWORD '${escapedPassword}';"`);
    } catch {
      // Role probably exists, update password
      await execAsync(`sudo -u postgres psql -c "ALTER ROLE \\"${dbUser}\\" WITH PASSWORD '${escapedPassword}';"`);
    }

    // Create DB
    await execAsync(`sudo -u postgres psql -c "CREATE DATABASE \\"${dbName}\\" OWNER \\"${dbUser}\\";"`);

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
