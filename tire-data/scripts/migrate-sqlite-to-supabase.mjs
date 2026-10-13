// Copies tire-data.db (SQLite) into a Supabase Postgres database.
//
// Usage:
//   node scripts/migrate-sqlite-to-supabase.mjs                  # local Supabase
//   DATABASE_URL="postgresql://..." node scripts/migrate-sqlite-to-supabase.mjs
//
// The target tables must already exist (supabase/migrations) and be empty.

import Database from 'better-sqlite3';
import postgres from 'postgres';
import path from 'path';

const LOCAL_URL = 'postgresql://postgres:postgres@127.0.0.1:55432/postgres';
const databaseUrl = process.env.DATABASE_URL || LOCAL_URL;
const sqlitePath = process.env.SQLITE_PATH || path.join(process.cwd(), 'tire-data.db');
const isLocal = /@(127\.0\.0\.1|localhost)[:/]/.test(databaseUrl);

const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
const sql = postgres(databaseUrl, { ssl: isLocal ? false : 'require', max: 1 });

// SQLite CURRENT_TIMESTAMP values are UTC without a zone marker
const toUtc = (value) => (value ? `${value.replace(' ', 'T')}Z` : null);

const sequenceFor = (table) =>
  sqlite.prepare('SELECT seq FROM sqlite_sequence WHERE name = ?').get(table)?.seq ?? 0;

async function main() {
  const measurements = sqlite
    .prepare('SELECT * FROM tire_measurements ORDER BY id')
    .all()
    .map((row) => ({ ...row, timestamp: toUtc(row.timestamp) }));
  const frames = sqlite.prepare('SELECT * FROM frame_images ORDER BY id').all();

  console.log(`Source: ${sqlitePath}`);
  console.log(`Target: ${databaseUrl.replace(/:[^:@/]+@/, ':****@')}`);
  console.log(`Rows: ${measurements.length} tire_measurements, ${frames.length} frame_images`);

  await sql.begin(async (tx) => {
    const [{ existing }] = await tx`
      SELECT (SELECT count(*) FROM public.tire_measurements)
           + (SELECT count(*) FROM public.frame_images) AS existing
    `;
    if (Number(existing) > 0) {
      throw new Error('Target tables are not empty, refusing to import');
    }

    const batchSize = 200;
    for (let i = 0; i < measurements.length; i += batchSize) {
      await tx`INSERT INTO public.tire_measurements ${tx(measurements.slice(i, i + batchSize))}`;
    }
    for (let i = 0; i < frames.length; i += batchSize) {
      await tx`INSERT INTO public.frame_images ${tx(frames.slice(i, i + batchSize))}`;
    }

    // Continue ids from where SQLite left off so deleted ids are never reused
    for (const table of ['tire_measurements', 'frame_images']) {
      const next = Math.max(sequenceFor(table), 1);
      await tx`SELECT setval(pg_get_serial_sequence(${'public.' + table}, 'id'), ${next})`;
    }
  });

  const [counts] = await sql`
    SELECT (SELECT count(*) FROM public.tire_measurements) AS measurements,
           (SELECT count(*) FROM public.frame_images) AS frames
  `;
  console.log(`Imported: ${counts.measurements} tire_measurements, ${counts.frames} frame_images`);

  if (Number(counts.measurements) !== measurements.length || Number(counts.frames) !== frames.length) {
    throw new Error('Row counts do not match after import');
  }
}

main()
  .catch((error) => {
    console.error('Import failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    sqlite.close();
    await sql.end();
  });
