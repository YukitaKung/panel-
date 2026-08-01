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

export async function PUT(request: Request) {
  try {
    const { type, dbName, tableName, oldData, newData } = await request.json();

    if (!type || !dbName || !tableName || !oldData || !newData || !isValidIdentifier(dbName) || !isValidIdentifier(tableName)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Build SET clause
    const setKeys = Object.keys(newData);
    if (setKeys.length === 0) return NextResponse.json({ success: true });

    // Build WHERE clause
    const whereKeys = Object.keys(oldData);

    if (type === "mysql") {
      const pool = await getMysqlConnection(dbName);
      
      const setClause = setKeys.map(k => `\`${k}\` = ?`).join(", ");
      const whereClause = whereKeys.map(k => oldData[k] === null ? `\`${k}\` IS NULL` : `\`${k}\` = ?`).join(" AND ");
      
      const setValues = setKeys.map(k => newData[k]);
      const whereValues = whereKeys.filter(k => oldData[k] !== null).map(k => oldData[k]);
      
      const query = `UPDATE \`${tableName}\` SET ${setClause} WHERE ${whereClause} LIMIT 1`;
      
      await pool.query(query, [...setValues, ...whereValues]);
      
    } else if (type === "postgres") {
      const pool = await getPgConnection(dbName);
      
      // PostgreSQL uses $1, $2, etc.
      let paramIndex = 1;
      const setValues: any[] = [];
      const whereValues: any[] = [];
      
      const setClause = setKeys.map(k => {
        setValues.push(newData[k]);
        return `"${k}" = $${paramIndex++}`;
      }).join(", ");
      
      const whereClause = whereKeys.map(k => {
        if (oldData[k] === null) {
          return `"${k}" IS NULL`;
        }
        whereValues.push(oldData[k]);
        return `"${k}" = $${paramIndex++}`;
      }).join(" AND ");
      
      // Postgres doesn't have LIMIT 1 for UPDATE directly in the standard way, 
      // but assuming whereKeys uniquely identify or we just update all matching (usually 1)
      const query = `UPDATE "${tableName}" SET ${setClause} WHERE ${whereClause}`;
      
      await pool.query(query, [...setValues, ...whereValues]);
      
    } else {
      return NextResponse.json({ error: "Unknown db type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DB Studio Data Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
