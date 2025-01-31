import { NextResponse } from 'next/server';
import db from '../../db';
import type { ExtractedFrame } from '../../types/types';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received POST data:', data);

    // Validate required fields
    if (!data.position) {
      return NextResponse.json(
        { message: 'Position is required' },
        { status: 400 }
      );
    }

    // Start a transaction
    db.prepare('BEGIN').run();
    
    try {
      // Insert tire measurement with exact schema match
      const result = db.prepare(`
        INSERT INTO tire_measurements (
          position,
          left_depth,
          center_depth,
          right_depth,
          brand,
          model,
          size_width,          /* matches schema */
          size_aspect_ratio,   /* matches schema */
          size_diameter,       /* matches schema */
          size_construction,   /* matches schema */
          load_index,
          speed_rating,
          vehicle_make,
          vehicle_model,
          vehicle_year,
          weather_condition,
          weather_temperature,
          tire_cleanliness,
          lighting_condition,
          damage_type,
          damage_description,
          measurement_device,
          original_video_url
          /* timestamp will be set automatically */
        ) VALUES (
          @position,
          @leftDepth,
          @centerDepth,
          @rightDepth,
          @brand,
          @model,
          @width,
          @aspectRatio,
          @diameter,
          @construction,
          @loadIndex,
          @speedRating,
          @vehicleMake,
          @vehicleModel,
          @vehicleYear,
          @weatherCondition,
          @weatherTemperature,
          @tireCleanliness,
          @lightingCondition,
          @damageType,
          @damageDescription,
          @measurementDevice,
          @originalVideoUrl
        )
      `).run({
        position: data.position,
        leftDepth: data.leftRegionDepth,
        centerDepth: data.centerRegionDepth,
        rightDepth: data.rightRegionDepth,
        brand: data.brand,
        model: data.model,
        width: data.width,                    // matches schema name
        aspectRatio: data.aspectRatio,        // matches schema name
        diameter: data.diameter,              // matches schema name
        construction: data.construction,      // matches schema name
        loadIndex: data.loadIndex,
        speedRating: data.speedRating,
        vehicleMake: data.vehicle.make,
        vehicleModel: data.vehicle.model,
        vehicleYear: data.vehicle.year,
        weatherCondition: data.weather.condition,
        weatherTemperature: data.weather.temperature,
        tireCleanliness: data.tireCleanliness,
        lightingCondition: data.lightingCondition,
        damageType: data.damageType,
        damageDescription: data.damageDescription,
        measurementDevice: data.measurementDevice,
        originalVideoUrl: data.originalVideoUrl
      });

      // Insert frame images if they exist
      if (data.frames && Array.isArray(data.frames)) {
        const frameStmt = db.prepare(`
          INSERT INTO frame_images (tire_measurement_id, frame_url)
          VALUES (@measurementId, @frameUrl)
        `);

        for (const frame of data.frames) {
          frameStmt.run({
            measurementId: result.lastInsertRowid,
            frameUrl: frame.url
          });
        }
      }

      // Commit transaction
      db.prepare('COMMIT').run();

      return NextResponse.json({
        status: 'success',
        data: { id: result.lastInsertRowid }
      });

    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      console.error('Database error:', error);
      throw error;
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to save measurement' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Add debug logging
    console.log('GET request received');
    
    // Check if we're testing table structure
    const checkTables = request.headers.get('x-check-tables');
    console.log('Check tables header:', checkTables);
    
    if (checkTables) {
      // Simple query to test connection
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name IN ('tire_measurements', 'frame_images')
      `).all();
      
      console.log('Found tables:', tables);
      return NextResponse.json({ tables });
    }

    // Regular GET - fetch measurements
    const measurements = db.prepare(`
      SELECT * FROM tire_measurements 
      ORDER BY timestamp DESC 
      LIMIT 5
    `).all();

    return NextResponse.json({
      status: 'success',
      data: measurements
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch data' },
      { status: 500 }
    );
  }
}