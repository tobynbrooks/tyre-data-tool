import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CONFIG } from './config';

// Add this console.log to debug
console.log('Cloudinary Config:', {
  cloud_name: CLOUDINARY_CONFIG.cloudName,
  api_key: CLOUDINARY_CONFIG.apiKey,
  // Don't log the full secret
  has_secret: !!CLOUDINARY_CONFIG.apiSecret
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CONFIG.cloudName,
  api_key: CLOUDINARY_CONFIG.apiKey,
  api_secret: CLOUDINARY_CONFIG.apiSecret,
});

export const cloudinaryClient = cloudinary;
