import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set (see .env.local)');
}

const isLocal = /@(127\.0\.0\.1|localhost)[:/]/.test(databaseUrl);

// Reuse one pool across Next.js dev hot reloads
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

const sql =
  globalForDb.sql ??
  postgres(databaseUrl, {
    ssl: isLocal ? false : 'require',
    max: 5,
    transform: { undefined: null },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sql = sql;
}

export default sql;
