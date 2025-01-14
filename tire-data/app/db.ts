import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';

console.log('Starting database initialization...');

// Log the database path to verify it's correct
const dbPath = path.join(process.cwd(), 'tire-data.db');
console.log('Database path is:', dbPath);

let db: DatabaseType;

try {
  db = new Database(dbPath);
  console.log('Database instance created');

  // Initialize the schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS tire_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      frame_urls TEXT,
      original_video_url TEXT,
      position TEXT NOT NULL,
      left_depth REAL NOT NULL,
      center_depth REAL NOT NULL,
      right_depth REAL NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      size TEXT NOT NULL,
      load_index TEXT,
      speed_rating TEXT,
      vehicle_make TEXT,
      vehicle_model TEXT,
      vehicle_year INTEGER,
      weather_condition TEXT,
      weather_temperature REAL,
      tire_cleanliness TEXT,
      lighting_condition TEXT,
      damage_type TEXT,
      damage_description TEXT,
      measurement_device TEXT,
      notes TEXT
    )
  `);
  console.log('tire_measurements table created/verified');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  console.log('Foreign keys enabled');

} catch (error) {
  console.error('CRITICAL DATABASE ERROR:', error);
  throw error;
}

export default db;