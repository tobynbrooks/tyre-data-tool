import { NextResponse } from 'next/server';
import sql from '../../db';


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

    const [row] = await sql`
      INSERT INTO tire_measurements (
        position,
        left_depth,
        center_depth,
        right_depth,
        brand,
        model,
        size_width,
        size_aspect_ratio,
        size_diameter,
        size_construction,
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
        ${data.position},
        ${data.leftRegionDepth},
        ${data.centerRegionDepth},
        ${data.rightRegionDepth},
        ${data.brand},
        ${data.model},
        ${data.width},
        ${data.aspectRatio},
        ${data.diameter},
        ${data.construction},
        ${data.loadIndex},
        ${data.speedRating},
        ${data.vehicle?.make},
        ${data.vehicle?.model},
        ${data.vehicle?.year},
        ${data.weather?.condition},
        ${data.weather?.temperature},
        ${data.tireCleanliness},
        ${data.lightingCondition},
        ${data.damageType},
        ${data.damageDescription},
        ${data.measurementDevice},
        ${data.originalVideoUrl}
      )
      RETURNING id
    `;

    return NextResponse.json({
      status: 'success',
      data: { id: Number(row.id) }
    });

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
      const tables = await sql`
        SELECT table_name AS name FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('tire_measurements', 'frame_images')
      `;
      
      console.log('Found tables:', tables);
      return NextResponse.json({ tables });
    }

    // Regular GET - fetch measurements
    const measurements = await sql`
      SELECT * FROM tire_measurements 
      ORDER BY timestamp DESC 
      LIMIT 5
    `;

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
