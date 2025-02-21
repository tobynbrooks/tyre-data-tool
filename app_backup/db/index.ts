import Database from 'better-sqlite3';
import path from 'path';

// Create a persistent database file in the project directory
const dbPath = path.join(process.cwd(), 'tire-data.db');

// Initialize database with better configuration
const db = new Database(dbPath, { 
  verbose: console.log,
  fileMustExist: false,
  timeout: 5000,
});

// Use default journal mode instead of WAL
db.pragma('journal_mode = DELETE');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tire_measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position TEXT NOT NULL,
    left_depth REAL,
    center_depth REAL,
    right_depth REAL,
    brand TEXT,
    model TEXT,
    
    /* Updated tire size fields */
    size_width INTEGER,          /* e.g., 225 */
    size_aspect_ratio INTEGER,   /* e.g., 45 */
    size_diameter INTEGER,       /* e.g., 17 */
    size_construction TEXT,      /* 'R', 'B', or 'D' */
    
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
    original_video_url TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS frame_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tire_measurement_id INTEGER NOT NULL,
    frame_url TEXT NOT NULL,
    FOREIGN KEY (tire_measurement_id) REFERENCES tire_measurements(id) ON DELETE CASCADE
  );
`);

// Set busy timeout for all connections
db.pragma('busy_timeout = 5000');

export default db;
