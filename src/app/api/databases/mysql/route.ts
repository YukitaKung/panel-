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
    
    // Get users for each DB (Heuristic: users with permissions to the DB)
    const dbs = await Promise.all(userDbs.map(async (db) => {
      try {
        const { stdout: sizeStdout } = await execAsync(`sudo mysql -e "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) FROM information_schema.tables WHERE table_schema = '${db}';"`);
        const sizeLines = sizeStdout.trim().split("\n");
        const sizeMb = sizeLines.length > 1 ? parseFloat(sizeLines[1]) || 0 : 0;
        
        return { name: db, type: "mysql", sizeMb, user: "auto" };
      } catch {
        return { name: db, type: "mysql", sizeMb: 0, user: "unknown" };
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

    // Create DB
    await execAsync('sudo mysql -e "CREATE DATABASE \\`' + dbName + '\\`;"');
    // Create User 
    await execAsync('sudo mysql -e "CREATE USER IF NOT EXISTS \\`' + dbUser + '\\`@\'localhost\' IDENTIFIED BY \'' + escapedPassword + '\';"');
    // Grant Privileges
    await execAsync('sudo mysql -e "GRANT ALL PRIVILEGES ON \\`' + dbName + '\\`.* TO \\`' + dbUser + '\\`@\'localhost\';"');
    await execAsync('sudo mysql -e "FLUSH PRIVILEGES;"');

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
