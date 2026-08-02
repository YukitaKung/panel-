import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const users = await db.systemUser.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { username, password, path, protocols } = await request.json();

    if (!username || !password || !path) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!/^[a-z_][a-z0-9_-]*$/.test(username)) {
      return NextResponse.json({ error: "Invalid username format" }, { status: 400 });
    }

    // Check if user exists in DB
    const existing = await db.systemUser.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Attempt to create user on the OS level
    try {
      // 1. Create directory if not exists
      await execAsync(`sudo mkdir -p ${path}`);
      
      // 2. Add user with home directory and bash
      await execAsync(`sudo useradd -m -d ${path} -s /bin/bash ${username}`);
      
      // 3. Set password
      await execAsync(`echo "${username}:${password}" | sudo chpasswd`);
      
      // 4. Set permissions (Ownership)
      await execAsync(`sudo chown -R ${username}:${username} ${path}`);
      
    } catch (osError: any) {
      console.error("OS User Creation Error:", osError);
      return NextResponse.json({ error: "Failed to create OS user: " + osError.message }, { status: 500 });
    }

    // Save to DB
    const user = await db.systemUser.create({
      data: {
        username,
        access: JSON.stringify(protocols || ["FTP"]),
        path,
        status: "active",
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
