import { NextResponse } from 'next/server';
import { cloudinaryClient } from '../../lib/cloudinary/client';
import { exiftool } from 'exiftool-vendored';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(request: Request) {
  try {
    console.log('Starting upload handler');
    const formData = await request.formData();
    const video = formData.get('video') as File;
    
    if (!video) {
      console.log('No video file found in request');
      return NextResponse.json(
        { error: 'No video uploaded' },
        { status: 400 }
      );
    }

    console.log('Received video:', {
      name: video.name,
      size: video.size,
      type: video.type
    });

    // Convert File to buffer
    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a temporary file path
    const tempFilePath = join(tmpdir(), `upload-${Date.now()}.mov`);
    
    try {
      // Write buffer to temporary file
      await writeFile(tempFilePath, buffer);

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinaryClient.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: 'tire-data/videos/raw',
            tags: ['tire_measurement', 'raw'],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      console.log('Cloudinary upload successful:', uploadResult);

      // Read metadata from the temp file
      try {
        const metadata = await exiftool.read(tempFilePath);
        console.log('Full metadata:', metadata);

        const deviceInfo = metadata.CameraModel || 'Unknown Device';

        return NextResponse.json({ 
          status: 'success',
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
          videoUrl: (uploadResult as any).secure_url,
          measurementDevice: deviceInfo,
          metadata: {
            cameraModel: metadata.CameraModel
          }
        });

      } catch (metadataError) {
        console.error('Metadata extraction error:', metadataError);
        return NextResponse.json({ 
          status: 'success',
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
          videoUrl: (uploadResult as any).secure_url,
          measurementDevice: 'Unknown Device',
          error: 'Failed to read metadata'
        });
      }

    } finally {
      // Clean up: Remove temporary file
      try {
        await exiftool.end();
        await unlink(tempFilePath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to upload video',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
