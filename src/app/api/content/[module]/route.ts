import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { modules, safeModule } from '@/lib/content';
import { getSession } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ module: string }> },
) {
  try {
    const { module } = await params;
    const key = safeModule(module);

    if (!key) {
      return NextResponse.json({ error: 'Invalid module.' }, { status: 404 });
    }

    const config = modules[key];
    const rows = await sql.query(
      `SELECT * FROM ${config.table} ORDER BY id DESC LIMIT 500`,
      [],
    );

    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error('Content GET error:', error);
    return NextResponse.json(
      { error: 'Unable to load content. Check the database connection.' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ module: string }> },
) {
  try {
    if (!(await getSession())) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { module } = await params;
    const key = safeModule(module);

    if (!key) {
      return NextResponse.json({ error: 'Invalid module.' }, { status: 404 });
    }

    const config = modules[key];
    const body = await request.json();
    const fields = config.fields.filter((field) => body[field] !== undefined);

    if (!fields.length) {
      return NextResponse.json(
        { error: 'No valid fields were submitted.' },
        { status: 400 },
      );
    }

    const values = fields.map((field) =>
      body[field] === '' ? null : body[field],
    );
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(',');

    const rows = await sql.query(
      `INSERT INTO ${config.table} (${fields.join(',')}) VALUES (${placeholders}) RETURNING *`,
      values,
    );

    return NextResponse.json(rows?.[0] || null, { status: 201 });
  } catch (error: any) {
    console.error('Content POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unable to save content.' },
      { status: 500 },
    );
  }
}
