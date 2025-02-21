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
    const uploadPromises: Promise<UploadApiResponse>[] = [];

    // Process each frame in the formData
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [key, value] of formData.entries()) {
      if (value instanceof Blob) {
        // Convert Blob to Buffer
        const bytes = await value.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create upload promise
        const uploadPromise = new Promise<UploadApiResponse>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'tire-data/frames',
              resource_type: 'image',
              format: 'jpg',
            },
            (error, result) => {
              if (error) reject(error);
              else if (result) resolve(result);
              else reject(new Error('No result from Cloudinary'));
            }
          ).end(buffer);
        });

        uploadPromises.push(uploadPromise);
      }
    }

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    // Extract URLs from results
    const urls = results.map(result => result.secure_url);

    return NextResponse.json({ urls });

  } catch (error) {
    console.error('Frame upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload frames' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
