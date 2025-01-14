import db from '../db';

export function initializeDatabase() {
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

  // Create sqlite_sequence table if it doesn't exist (for AUTOINCREMENT)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sqlite_sequence(name,seq)
  `);

  console.log('Database schema initialized to match DB Browser structure');
}
