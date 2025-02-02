import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';
import { exiftool, Tags } from 'exiftool-vendored';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
  let tempFilePath: string | null = null;
  
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video');
    
    if (!videoFile || !(videoFile instanceof File)) {
      return NextResponse.json(
        { error: 'No valid video file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create temporary file for metadata extraction
    tempFilePath = join(tmpdir(), `upload-${Date.now()}.mov`);
    await writeFile(tempFilePath, buffer);

    // Extract metadata using exiftool
    const metadata = await exiftool.read(tempFilePath);
    console.log('Video metadata:', metadata);

    // Get device info from CameraLensModel field
    const deviceInfo = (metadata as any).CameraLensModel || 'Unknown Device';

    // Upload buffer to Cloudinary
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'tire-data/videos',
          allowed_formats: ['mp4', 'mov', 'avi'],
          max_file_size: 100000000 // 100MB limit
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result);
          else reject(new Error('No result from Cloudinary'));
        }
      ).end(buffer);
    });

    return NextResponse.json({ 
      status: 'success',
      videoUrl: result.secure_url,
      measurementDevice: deviceInfo,
      metadata: {
        cameraLensModel: (metadata as any).CameraLensModel,
      }
    });

  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  } finally {
    // Cleanup: Remove temporary file and end exiftool
    if (tempFilePath) {
      try {
        await exiftool.end();
        await unlink(tempFilePath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
