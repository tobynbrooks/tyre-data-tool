import { NextResponse } from 'next/server';
import { cloudinaryClient } from '../../lib/cloudinary/client';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // First test connection
    const pingResult = await cloudinaryClient.api.ping();
    console.log('Connection test:', pingResult);

    // Try to upload an existing video from your public/uploads folder
    const videoPath = path.join(process.cwd(), 'public', 'uploads', 'video_1737916352915_IMG_3745_2.MOV');
    const videoBuffer = readFileSync(videoPath);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinaryClient.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'tire-data/videos',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(videoBuffer);
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Connection and upload successful',
      ping: pingResult,
      upload: uploadResult
    });
    
  } catch (error: unknown) {
    console.error('Test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}
