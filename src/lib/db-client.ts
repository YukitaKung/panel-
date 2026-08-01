import mysql from "mysql2/promise";
import { Pool } from "pg";

const MASTER_USER = "hostpanel_admin";
const MASTER_PASS = process.env.DB_PANEL_PASSWORD || "afc392556efee74182f22e84ad920a11";

// Cache for connection pools
const pgPools: Record<string, Pool> = {};
const mysqlPools: Record<string, mysql.Pool> = {};

export async function getMysqlConnection(dbName: string) {
  if (!mysqlPools[dbName]) {
    mysqlPools[dbName] = mysql.createPool({
      host: "localhost",
      user: MASTER_USER,
      password: MASTER_PASS,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true
    });
  }
  return mysqlPools[dbName];
}

export async function getPgConnection(dbName: string) {
  if (!pgPools[dbName]) {
    pgPools[dbName] = new Pool({
      host: "localhost",
      user: MASTER_USER,
      password: MASTER_PASS,
      database: dbName,
      max: 10, // Max 10 connections per db
    });
  }
  return pgPools[dbName];
}
