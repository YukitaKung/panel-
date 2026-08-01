import { NextResponse } from "next/server";
import { getMysqlConnection, getPgConnection } from "@/lib/db-client";
import { isValidIdentifier } from "@/lib/db-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const dbName = searchParams.get("db");
  const tableName = searchParams.get("table");

  if (!type || !dbName || !tableName || !isValidIdentifier(dbName) || !isValidIdentifier(tableName)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  try {
    let rows: any[] = [];
    let columns: string[] = [];

    if (type === "mysql") {
      const pool = await getMysqlConnection(dbName);
      const [res] = await pool.query(`SELECT * FROM \`${tableName}\` LIMIT 50;`);
      rows = res as any[];
      if (rows.length > 0) columns = Object.keys(rows[0]);
    } else if (type === "postgres") {
      const pool = await getPgConnection(dbName);
      const res = await pool.query(`SELECT * FROM "${tableName}" LIMIT 50;`);
      rows = res.rows;
      if (rows.length > 0) columns = Object.keys(rows[0]);
    } else {
      return NextResponse.json({ error: "Unknown db type" }, { status: 400 });
    }

    return NextResponse.json({ rows, columns });
  } catch (error: any) {
    console.error("DB Studio Data Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
