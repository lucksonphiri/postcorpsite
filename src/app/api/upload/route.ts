import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import path from 'node:path';

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function safeFileName(originalName: string) {
  const extension = path.extname(originalName).toLowerCase();
  const base = path
    .basename(originalName, extension)
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return `${base || 'upload'}${extension || ''}`;
}

export async function POST(request: Request) {
  try {
    if (!(await getSession())) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            'Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to .env.local and to the Vercel project environment variables.',
        },
        { status: 500 },
      );
    }

    const form = await request.formData();
    const files = form
      .getAll('files')
      .filter((value): value is File => value instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: 'No files were selected.' }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      if (!allowedTypes.has(file.type)) continue;
      if (file.size > 10 * 1024 * 1024) continue;

      const storageFolder = file.type.startsWith('image/') ? 'public/images' : 'public/documents';
      const blob = await put(`${storageFolder}/${safeFileName(file.name)}`, file, {
        access: 'public',
        addRandomSuffix: true,
        contentType: file.type || undefined,
      });

      urls.push(blob.url);
    }

    if (!urls.length) {
      return NextResponse.json(
        {
          error:
            'No supported files were uploaded. Use JPG, PNG, WEBP, GIF, PDF, DOC or DOCX files below 10 MB.',
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ urls });
  } catch (error: any) {
    console.error('Blob upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Upload failed.' },
      { status: 500 },
    );
  }
}
