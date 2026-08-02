import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    const subdomain = await db.subdomain.findUnique({ where: { domain } });
    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain not found" }, { status: 404 });
    }

    // Set status to pending
    await db.subdomain.update({
      where: { domain },
      data: { sslStatus: "pending" }
    });

    try {
      // Run Certbot
      const cmd = `sudo certbot --nginx -d ${domain} --non-interactive --agree-tos --register-unsafely-without-email`;
      await execAsync(cmd);
      
      // Update DB to active
      await db.subdomain.update({
        where: { domain },
        data: { sslStatus: "active", sslEnabled: true }
      });
      
      return NextResponse.json({ success: true, message: "SSL Certificate issued successfully" });
    } catch (certError: any) {
      console.error("Certbot Error:", certError);
      
      // Update DB to error
      await db.subdomain.update({
        where: { domain },
        data: { sslStatus: "error" }
      });
      
      return NextResponse.json({ error: "Failed to issue SSL: " + certError.message }, { status: 500 });
    }

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { domain, sslEnabled } = await request.json();
    
    if (!domain) {
      return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    const updated = await db.subdomain.update({
      where: { domain },
      data: { sslEnabled }
    });

    return NextResponse.json({ success: true, subdomain: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update SSL settings" }, { status: 500 });
  }
}
