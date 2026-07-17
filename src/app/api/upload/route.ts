import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function cleanFileName(fileName: string) {
  const lastDot = fileName.lastIndexOf('.');
  const extension = lastDot >= 0 ? fileName.slice(lastDot).toLowerCase() : '';
  const base = (lastDot >= 0 ? fileName.slice(0, lastDot) : fileName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'file'}${extension}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await getSession())) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            'Vercel Blob is not configured. Connect a Blob store, add BLOB_READ_WRITE_TOKEN to the Production environment, then redeploy.',
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const submitted = [
      ...formData.getAll('files'),
      ...formData.getAll('file'),
    ];
    const files = submitted.filter((value): value is File => value instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: 'No file was received.' }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      if (!file.size) {
        return NextResponse.json({ error: `${file.name} is empty.` }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name} is larger than 4 MB.` },
          { status: 400 },
        );
      }
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: `${file.name} is not a supported image or document.` },
          { status: 400 },
        );
      }

      const folder = file.type.startsWith('image/') ? 'online-images' : 'documents';
      const pathname = `${folder}/${Date.now()}-${crypto.randomUUID()}-${cleanFileName(file.name)}`;
      const blob = await put(pathname, file, {
        access: 'public',
        addRandomSuffix: false,
        contentType: file.type,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      urls.push(blob.url);
    }

    return NextResponse.json(
      {
        success: true,
        urls,
        url: urls[0] || null,
        image_url: urls[0] || null,
        file_url: urls[0] || null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Blob upload error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'The upload failed.',
      },
      { status: 500 },
    );
  }
}
