import { neon } from '@neondatabase/serverless';

let client: ReturnType<typeof neon> | null = null;

function getClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is missing. Add it in .env.local for localhost and in Vercel Project Settings > Environment Variables for deployment.',
    );
  }

  if (!client) {
    client = neon(databaseUrl);
  }

  return client;
}

// Supports both sql`SELECT ...` and sql('SELECT ...', [values]).
export const sql: any = (...args: any[]) => (getClient() as any).apply(null, args);
