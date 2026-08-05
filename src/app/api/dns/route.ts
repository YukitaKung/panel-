import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    const whereClause = domain ? { domain } : {};
    
    const records = await prisma.dnsRecord.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" }
    });
    
    return NextResponse.json({ records });
  } catch (error: any) {
    console.error("Failed to fetch DNS records:", error);
    return NextResponse.json({ error: "Failed to fetch DNS records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { domain, type, name, content, ttl } = body;

    if (!domain || !type || !name || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newRecord = await prisma.dnsRecord.create({
      data: {
        domain,
        type,
        name,
        content,
        ttl: ttl ? parseInt(ttl.toString(), 10) : 3600,
      }
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create DNS record:", error);
    return NextResponse.json({ error: "Failed to create DNS record" }, { status: 500 });
  }
}
