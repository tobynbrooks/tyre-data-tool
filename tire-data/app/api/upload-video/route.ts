import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
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
      videoUrl: result.secure_url,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll handle raw video data
  },
};
