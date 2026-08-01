import { NextResponse } from "next/server";
import { getMysqlConnection, getPgConnection } from "@/lib/db-client";
import { isValidIdentifier } from "@/lib/db-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const dbName = searchParams.get("db");

  if (!type || !dbName || !isValidIdentifier(dbName)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  try {
    let tables: string[] = [];

    if (type === "mysql") {
      const pool = await getMysqlConnection(dbName);
      const [rows] = await pool.query<any[]>("SHOW TABLES");
      tables = rows.map(r => Object.values(r)[0] as string);
    } else if (type === "postgres") {
      const pool = await getPgConnection(dbName);
      const res = await pool.query(`
        SELECT tablename 
        FROM pg_catalog.pg_tables 
        WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';
      `);
      tables = res.rows.map(r => r.tablename);
    } else {
      return NextResponse.json({ error: "Unknown db type" }, { status: 400 });
    }

    return NextResponse.json({ tables });
  } catch (error: any) {
    console.error("DB Studio Tables Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
