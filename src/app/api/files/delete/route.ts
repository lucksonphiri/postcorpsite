import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    if (!(await getSession())) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const url = body?.url;

    if (typeof url !== 'string' || !url.startsWith('https://')) {
      return NextResponse.json(
        { error: 'A valid Vercel Blob URL is required.' },
        { status: 400 },
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Vercel Blob is not configured.' },
        { status: 500 },
      );
    }

    await del(url);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Blob delete error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unable to delete the file.' },
      { status: 500 },
    );
  }
}
