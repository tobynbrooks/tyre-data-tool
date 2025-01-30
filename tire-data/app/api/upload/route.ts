import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const video = formData.get('video') as File;
    
    if (!video) {
      return NextResponse.json(
        { error: 'No video uploaded' },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const filename = `video_${timestamp}_${video.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
    // Define upload directory path
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Write file to disk
    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    
    // Return the URL path that will be accessible from the browser
    const videoUrl = `/uploads/${filename}`;

    console.log('Video uploaded successfully:', videoUrl);

    return NextResponse.json({ 
      status: 'success',
      videoUrl: `/uploads/${filename}`
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to upload video' 
      },
      { status: 500 }
    );
  }
}
