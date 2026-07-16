import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { modules, safeModule } from '@/lib/content';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ module: string; id: string }> },
) {
  try {
    if (!(await getSession())) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { module, id } = await params;
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
    const setClause = fields
      .map((field, index) => `${field}=$${index + 1}`)
      .join(',');

    const rows = await sql.query(
      `UPDATE ${config.table} SET ${setClause}, updated_at=NOW() WHERE id=$${fields.length + 1} RETURNING *`,
      [...values, id],
    );

    if (!rows?.[0]) {
      return NextResponse.json({ error: 'Content not found.' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('Content PUT error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unable to update content.' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ module: string; id: string }> },
) {
  try {
    if (!(await getSession())) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { module, id } = await params;
    const key = safeModule(module);

    if (!key) {
      return NextResponse.json({ error: 'Invalid module.' }, { status: 404 });
    }

    await sql.query(`DELETE FROM ${modules[key].table} WHERE id=$1`, [id]);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Content DELETE error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unable to delete content.' },
      { status: 500 },
    );
  }
}
