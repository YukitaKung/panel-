import { NextResponse } from "next/server";
import { getMysqlConnection, getPgConnection } from "@/lib/db-client";
import { isValidIdentifier } from "@/lib/db-utils";

export async function POST(request: Request) {
  try {
    const { type, dbName, query } = await request.json();

    if (!type || !dbName || !query || !isValidIdentifier(dbName)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    let rows: any[] = [];
    let columns: string[] = [];
    let message = "";

    if (type === "mysql") {
      const pool = await getMysqlConnection(dbName);
      const [res] = await pool.query(query);
      if (Array.isArray(res)) {
        rows = res as any[];
        if (rows.length > 0) columns = Object.keys(rows[0]);
        message = `${rows.length} rows returned.`;
      } else {
        // OkPacket (INSERT/UPDATE/DELETE)
        const okRes = res as any;
        message = `Query OK, ${okRes.affectedRows} rows affected.`;
      }
    } else if (type === "postgres") {
      const pool = await getPgConnection(dbName);
      const res = await pool.query(query);
      
      if (res.command === "SELECT" || res.rows.length > 0) {
        rows = res.rows;
        if (rows.length > 0) columns = Object.keys(rows[0]);
        message = `${rows.length} rows returned.`;
      } else {
        message = `Query OK, ${res.rowCount || 0} rows affected.`;
      }
    } else {
      return NextResponse.json({ error: "Unknown db type" }, { status: 400 });
    }

    return NextResponse.json({ rows, columns, message });
  } catch (error: any) {
    console.error("DB Studio Query Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
