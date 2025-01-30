import { NextResponse } from 'next/server';
import db from '../../db/index';
import type { ExtractedFrame } from '../../types/types';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('API received data:', data);

    // Validate required fields
    if (!data.position) {
      return NextResponse.json(
        { message: 'Position is required' },
        { status: 400 }
      );
    }

    // Start a transaction
    const result = db.transaction(() => {
      // Insert tire measurement
      const measurementStmt = db.prepare(`
        INSERT INTO tire_measurements (
          position,
          left_depth,
          center_depth,
          right_depth,
          brand,
          model,
          size,
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
        ) VALUES (
          @position,
          @leftDepth,
          @centerDepth,
          @rightDepth,
          @brand,
          @model,
          @size,
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
      `);

      const measurementResult = measurementStmt.run({
        position: data.position,
        leftDepth: data.leftRegionDepth,
        centerDepth: data.centerRegionDepth,
        rightDepth: data.rightRegionDepth,
        brand: data.brand,
        model: data.model,
        size: data.size,
        loadIndex: data.loadIndex,
        speedRating: data.speedRating,
        vehicleMake: data.vehicle?.make,
        vehicleModel: data.vehicle?.model,
        vehicleYear: data.vehicle?.year,
        weatherCondition: data.weather?.condition,
        weatherTemperature: data.weather?.temperature,
        tireCleanliness: data.tireCleanliness,
        lightingCondition: data.lightingCondition,
        damageType: data.damageType,
        damageDescription: data.damageDescription,
        measurementDevice: data.measurementDevice,
        originalVideoUrl: data.originalVideoUrl || ''
      });

      const measurementId = measurementResult.lastInsertRowid;

      // Insert frame images if they exist
      if (data.frames && Array.isArray(data.frames) && data.frames.length > 0) {
        const frameStmt = db.prepare(`
          INSERT INTO frame_images (tire_measurement_id, frame_url)
          VALUES (@measurementId, @frameUrl)
        `);

        for (const frame of data.frames) {
          frameStmt.run({
            measurementId,
            frameUrl: frame.url
          });
        }
      }

      return measurementId;
    })();

    return NextResponse.json({
      status: 'success',
      data: { id: result }
    });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to save measurement' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Check if we're requesting table structure
    const checkTables = request.headers.get('x-check-tables');
    
    if (checkTables) {
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name IN ('tire_measurements', 'frame_images')
      `).all();
      return NextResponse.json({ tables });
    }

    // Get measurements with their associated frames
    const measurements = db.prepare(`
      SELECT 
        t.*,
        GROUP_CONCAT(f.frame_url) as frame_urls
      FROM tire_measurements t
      LEFT JOIN frame_images f ON t.id = f.tire_measurement_id
      GROUP BY t.id
      ORDER BY t.timestamp DESC
    `).all();

    return NextResponse.json({
      status: 'success',
      data: measurements
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch measurements' },
      { status: 500 }
    );
  }
}