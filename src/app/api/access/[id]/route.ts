import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await db.systemUser.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user from OS
    try {
      await execAsync(`sudo userdel ${user.username}`);
    } catch (osError: any) {
      console.warn("Could not delete OS user (might already be deleted):", osError.message);
    }

    // Delete from DB
    await db.systemUser.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const user = await db.systemUser.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Change password on OS
    try {
      await execAsync(`echo "${user.username}:${password}" | sudo chpasswd`);
    } catch (osError: any) {
      console.error("OS Password Change Error:", osError.message);
      return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
