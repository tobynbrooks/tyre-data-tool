import { NextResponse } from 'next/server';
import db from '../../db';
import type { ExtractedFrame } from '../../types/types';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('API received data:', data); // Debug log

    // Validate required fields
    if (!data.position) {
      return NextResponse.json(
        { message: 'Position is required' },
        { status: 400 }
      );
    }

    const result = db.prepare(`
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
        timestamp,
        frame_urls
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
        @timestamp,
        @frameUrls
      )
    `).run({
      position: data.position,
      leftDepth: data.leftRegionDepth || 0,
      centerDepth: data.centerRegionDepth || 0,
      rightDepth: data.rightRegionDepth || 0,
      brand: data.brand || '',
      model: data.model || '',
      size: data.size || '',
      loadIndex: data.loadIndex || '',
      speedRating: data.speedRating || '',
      vehicleMake: data.vehicle?.make || '',
      vehicleModel: data.vehicle?.model || '',
      vehicleYear: data.vehicle?.year || new Date().getFullYear(),
      weatherCondition: data.weather?.condition || 'Dry',
      weatherTemperature: data.weather?.temperature || 20,
      tireCleanliness: data.tireCleanliness || 'Clean',
      lightingCondition: data.lightingCondition || 'Good',
      damageType: data.damageType || 'none',
      damageDescription: data.damageDescription || '',
      measurementDevice: data.measurementDevice || '',
      timestamp: data.timestamp || new Date().toISOString(),
      frameUrls: JSON.stringify(data.frames?.map((f: { url: string }) => f.url) || [])
    });

    console.log('Database insert result:', result);

    return NextResponse.json({
      status: 'success',
      message: 'Measurement saved successfully',
      id: result.lastInsertRowid
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to save measurement',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const measurements = db.prepare('SELECT * FROM tire_measurements').all();
    return NextResponse.json({ 
      status: 'success',
      data: measurements 
    });
  } catch (error) {
    console.error('Error in GET /api/measurements:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to fetch measurements',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}