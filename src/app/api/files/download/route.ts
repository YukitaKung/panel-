import { NextResponse } from 'next/server';
import { createReadStream, statSync } from 'fs';
import path from 'path';

const BASE_DIR = process.platform === "win32" ? "C:\\var\\www" : "/var/www";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');
  
  if (!filePath) {
    return new NextResponse('Missing path', { status: 400 });
  }

  let resolved = filePath;
  if (!resolved.startsWith(BASE_DIR)) {
    const normalized = filePath.replace(/^[\/\\]+/, "");
    resolved = path.resolve(BASE_DIR, normalized);
  }
  
  if (!resolved.startsWith(BASE_DIR)) {
    return new NextResponse('Access Denied', { status: 403 });
  }
  
  try {
    const stat = statSync(resolved);
    const fileStream = createReadStream(resolved);
    
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk as any)));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Disposition': `attachment; filename="${path.basename(resolved)}"`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': stat.size.toString(),
      },
    });
  } catch (error) {
    console.error("Download Error:", error);
    return new NextResponse('File not found', { status: 404 });
  }
}
