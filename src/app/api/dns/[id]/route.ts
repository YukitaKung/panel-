import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { domain, type, name, content, ttl } = body;

    const updatedRecord = await prisma.dnsRecord.update({
      where: { id },
      data: {
        domain,
        type,
        name,
        content,
        ttl: ttl ? parseInt(ttl.toString(), 10) : 3600,
      }
    });

    return NextResponse.json(updatedRecord);
  } catch (error: any) {
    console.error("Failed to update DNS record:", error);
    return NextResponse.json({ error: "Failed to update DNS record" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.dnsRecord.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete DNS record:", error);
    return NextResponse.json({ error: "Failed to delete DNS record" }, { status: 500 });
  }
}
