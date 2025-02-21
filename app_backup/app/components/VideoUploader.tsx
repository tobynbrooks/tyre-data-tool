'use client';

import { useState, useRef } from 'react';
import type { ExtractedFrame } from '../types/types';

interface VideoUploaderProps {
  onFramesExtracted: (frames: ExtractedFrame[], videoUrl: string, measurementDevice?: string) => void;
}

interface FrameExtractionConfig {
  maxFrames: number;
  framesPerSecond: number;
  quality: number;
  scaleFactor: number;
  randomize: boolean;
}

const DEFAULT_CONFIG: FrameExtractionConfig = {
  maxFrames: 5,
  framesPerSecond: 1,
  quality: 0.8,
  scaleFactor: 0.5,
  randomize: false
};

const extractFramesFromVideo = async (
  file: File,
  config: FrameExtractionConfig = DEFAULT_CONFIG
): Promise<ExtractedFrame[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: ExtractedFrame[] = [];
    
    video.playsInline = true;
    video.muted = true;
    video.autoplay = false;
    
    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;
    
    video.onloadeddata = () => {
      console.log('Video loaded:', {
        duration: video.duration,
        dimensions: `${video.videoWidth}x${video.videoHeight}`
      });

      canvas.width = video.videoWidth * config.scaleFactor;
      canvas.height = video.videoHeight * config.scaleFactor;
      
      if (!ctx) {
        URL.revokeObjectURL(videoUrl);
        reject(new Error('Canvas context not available'));
        return;
      }

      const frameInterval = 1 / config.framesPerSecond;
      const totalPossibleFrames = Math.floor(video.duration / frameInterval);
      const maxFrames = Math.min(config.maxFrames, totalPossibleFrames);

      let timestamps = Array.from(
        { length: totalPossibleFrames },
        (_, i) => i * frameInterval
      );

      if (config.randomize) {
        timestamps = timestamps.sort(() => Math.random() - 0.5);
      }
      timestamps = timestamps.slice(0, maxFrames).sort((a, b) => a - b);

      let currentFrame = 0;

      const processNextFrame = () => {
        if (currentFrame >= timestamps.length) {
          URL.revokeObjectURL(videoUrl);
          resolve(frames);
          return;
        }

        video.currentTime = timestamps[currentFrame];
      };

      video.onseeked = async () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to blob
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to create blob'));
              },
              'image/jpeg',
              config.quality
            );
          });

          const url = URL.createObjectURL(blob);
          
          frames.push({
            frameNumber: currentFrame,
            blob,
            url,
          });

          currentFrame++;
          processNextFrame();
        } catch (error) {
          console.error('Frame capture error:', error);
          currentFrame++;
          processNextFrame();
        }
      };

      processNextFrame();
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Error loading video'));
    };
  });
};

// Add this function to handle frame uploads
const uploadFramesToCloudinary = async (frames: ExtractedFrame[]) => {
  const formData = new FormData();
  
  // Add each frame's blob to formData
  frames.forEach((frame, index) => {
    formData.append(`frame${index}`, frame.blob, `frame${index}.jpg`);
  });

  console.log('🖼️ DEBUG: Uploading frames to Cloudinary:', frames.length);
  
  const response = await fetch('/api/upload-frame', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to upload frames');
  }

  const { urls } = await response.json();
  console.log('🖼️ DEBUG: Cloudinary Frame URLs received:', urls);
  
  // Return frames with Cloudinary URLs
  return frames.map((frame, index) => ({
    ...frame,
    url: urls[index]
  }));
};

export default function VideoUploader({ onFramesExtracted }: VideoUploaderProps) {
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permanentVideoUrl, setPermanentVideoUrl] = useState<string>('');

  // Handle video file selection
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // First upload video to Cloudinary
      const formData = new FormData();
      formData.append('video', file);
      console.log('�� Uploading video:', file.name);

      const uploadResponse = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      const responseData = await uploadResponse.json();
      console.log('🎥 Upload response:', responseData);

      if (!uploadResponse.ok || !responseData.videoUrl) {
        throw new Error('Failed to upload video or get URL');
      }

      const permanentUrl = responseData.videoUrl;
      const measurementDevice = responseData.measurementDevice;
      
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      setPermanentVideoUrl(permanentUrl);

      // Now extract and upload frames
      console.log('🖼️ Extracting frames...');
      const extractedFrames = await extractFramesFromVideo(file);
      console.log('🖼️ Uploading frames to Cloudinary...');
      const framesWithUrls = await uploadFramesToCloudinary(extractedFrames);
      setFrames(framesWithUrls);
      
      // Pass everything to parent
      onFramesExtracted(framesWithUrls, permanentUrl, measurementDevice);

    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload video');
    }
  };

  const renderFrameThumbnails = () => {
    if (frames.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Extracted Frames</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {frames.map((frame) => (
            <div 
              key={frame.frameNumber} 
              className="relative aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <img
                src={frame.url}
                alt={`Frame ${frame.frameNumber + 1}`}
                className="w-full h-full object-contain"
                loading="lazy"
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                Frame {frame.frameNumber + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="hidden"
          id="video-upload"
        />
        <label
          htmlFor="video-upload"
          className="flex flex-col items-center cursor-pointer"
        >
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span className="mt-2 text-base text-gray-600">
            {video ? 'Change video' : 'Upload video'}
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Video Preview */}
      {videoPreview && (
        <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoPreview}
            controls
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Render Frame Thumbnails */}
      {renderFrameThumbnails()}
    </div>
  );
}