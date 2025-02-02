import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { exiftool, Tags } from 'exiftool-vendored';

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

    // Create unique filename
    const timestamp = Date.now();
    const filename = `video_${timestamp}_${video.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    console.log('Creating upload directory:', uploadDir);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    console.log('Writing file to:', filePath);

    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log('File written successfully, reading metadata...');

    // Read metadata using ExifTool
    try {
      const metadata = await exiftool.read(filePath);
      console.log('Full metadata:', metadata);

      // Access CameraLensModel using string index notation
      const deviceInfo = (metadata as any)['CameraLensModel'] || 'Unknown Device';

      console.log('Device info:', deviceInfo);

      return NextResponse.json({ 
        status: 'success',
        videoUrl: `/uploads/${filename}`,
        measurementDevice: deviceInfo,
        metadata: {
          cameraLensModel: (metadata as any)['CameraLensModel']
        }
      });

    } catch (metadataError) {
      console.error('Metadata extraction error:', metadataError);
      return NextResponse.json({ 
        status: 'success',
        videoUrl: `/uploads/${filename}`,
        measurementDevice: 'Unknown Device',
        error: 'Failed to read metadata'
      });
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
