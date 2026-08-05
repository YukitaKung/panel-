import { NextResponse } from "next/server";
import { getMysqlConnection, getPgConnection } from "@/lib/db-client";
import { isValidIdentifier } from "@/lib/db-utils";

export async function POST(request: Request) {
  try {
    const { type, dbName, query, targetType = "single", tag } = await request.json();

    if (!type || !query || (targetType === "single" && !isValidIdentifier(dbName))) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    let rows: any[] = [];
    let columns: string[] = [];
    let message = "";

    // Determine target databases
    let targetDbs: string[] = [];
    if (targetType === "tag" && tag) {
      const { db } = await import("@/lib/db");
      const dbTags = await db.databaseTag.findMany({ where: { engine: type } });
      targetDbs = dbTags.filter(t => {
        try {
          const parsed = JSON.parse(t.tags || "[]");
          return Array.isArray(parsed) && parsed.includes(tag);
        } catch { return false; }
      }).map(t => t.dbName);

      if (targetDbs.length === 0) {
        return NextResponse.json({ error: `No databases found with tag '${tag}'` }, { status: 404 });
      }
    } else {
      targetDbs = [dbName];
    }

    let totalAffected = 0;
    const errors: string[] = [];

    for (const targetDb of targetDbs) {
      try {
        if (type === "mysql") {
          const pool = await getMysqlConnection(targetDb);
          const [res] = await pool.query(query);
          if (Array.isArray(res)) {
            // If it's a SELECT, we just keep the last result or aggregate?
            // User said they only use it for INSERT/UPDATE/CREATE, so we just return the first DB's rows if any.
            if (rows.length === 0) {
              rows = res as any[];
              if (rows.length > 0) columns = Object.keys(rows[0]);
            }
          } else {
            totalAffected += (res as any).affectedRows || 0;
          }
        } else if (type === "postgres") {
          const pool = await getPgConnection(targetDb);
          const res = await pool.query(query);
          
          if (res.command === "SELECT" || res.rows.length > 0) {
            if (rows.length === 0) {
              rows = res.rows;
              if (rows.length > 0) columns = Object.keys(rows[0]);
            }
          } else {
            totalAffected += res.rowCount || 0;
          }
        }
      } catch (dbErr: any) {
        errors.push(`Error in DB '${targetDb}': ${dbErr.message}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: `Query failed on some databases:\n${errors.join("\n")}` }, { status: 500 });
    }

    if (targetType === "tag") {
      message = `Query OK across ${targetDbs.length} databases, ${totalAffected} rows affected total.`;
    } else {
      if (rows.length > 0) {
        message = `${rows.length} rows returned.`;
      } else {
        message = `Query OK, ${totalAffected} rows affected.`;
      }
    }

    return NextResponse.json({ rows, columns, message });
  } catch (error: any) {
    console.error("DB Studio Query Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
