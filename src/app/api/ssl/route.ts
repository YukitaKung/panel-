import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);
const dataFile = path.join(process.cwd(), "data", "subdomains.json");

async function getSubdomains() {
  try {
    const data = await fs.readFile(dataFile, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveSubdomains(subdomains: any[]) {
  await fs.writeFile(dataFile, JSON.stringify(subdomains, null, 2));
}

export async function POST(request: Request) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    const subdomains = await getSubdomains();
    const subdomainIndex = subdomains.findIndex((s: any) => s.domain === domain);
    
    if (subdomainIndex === -1) {
      return NextResponse.json({ error: "Subdomain not found" }, { status: 404 });
    }

    // Set status to pending
    subdomains[subdomainIndex].sslStatus = "pending";
    await saveSubdomains(subdomains);

    try {
      // Run Certbot
      const cmd = `sudo certbot --nginx -d ${domain} --non-interactive --agree-tos --register-unsafely-without-email`;
      await execAsync(cmd);
      
      // Update JSON to active
      const updatedSubdomains = await getSubdomains();
      const updatedIndex = updatedSubdomains.findIndex((s: any) => s.domain === domain);
      if (updatedIndex !== -1) {
        updatedSubdomains[updatedIndex].sslStatus = "active";
        updatedSubdomains[updatedIndex].sslEnabled = true;
        await saveSubdomains(updatedSubdomains);
      }
      
      return NextResponse.json({ success: true, message: "SSL Certificate issued successfully" });
    } catch (certError: any) {
      console.error("Certbot Error:", certError);
      
      // Update JSON to error
      const errorSubdomains = await getSubdomains();
      const errorIndex = errorSubdomains.findIndex((s: any) => s.domain === domain);
      if (errorIndex !== -1) {
        errorSubdomains[errorIndex].sslStatus = "error";
        await saveSubdomains(errorSubdomains);
      }
      
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

    const subdomains = await getSubdomains();
    const subdomainIndex = subdomains.findIndex((s: any) => s.domain === domain);

    if (subdomainIndex === -1) {
      return NextResponse.json({ error: "Subdomain not found" }, { status: 404 });
    }

    subdomains[subdomainIndex].sslEnabled = sslEnabled;
    await saveSubdomains(subdomains);

    return NextResponse.json({ success: true, subdomain: subdomains[subdomainIndex] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update SSL settings" }, { status: 500 });
  }
}
