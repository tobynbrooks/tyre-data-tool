import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Cloudinary is not configured' },
      { status: 500 }
    );
  }

  // The browser must send these exact params, or Cloudinary rejects the signature.
  const params = {
    timestamp: String(Math.round(Date.now() / 1000)),
    folder: 'tire-data/videos',
    allowed_formats: 'mp4,mov,avi',
  };

  const signature = cloudinary.utils.api_sign_request(params, apiSecret);

  return NextResponse.json({ cloudName, apiKey, signature, params });
}
