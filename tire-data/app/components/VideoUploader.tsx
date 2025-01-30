'use client';

import { useState, useRef } from 'react';
import type { ExtractedFrame } from '../types/types';

interface VideoUploaderProps {
  onFramesExtracted: (frames: ExtractedFrame[], videoUrl: string) => void;
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
      const formData = new FormData();
      formData.append('video', file);

      console.log('Uploading video:', file.name);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const responseData = await uploadResponse.json();
      console.log('Upload response:', responseData);

      if (!uploadResponse.ok || !responseData.videoUrl) {
        throw new Error('Failed to upload video or get URL');
      }

      const permanentUrl = responseData.videoUrl;
      console.log('Setting permanent URL:', permanentUrl);

      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      setPermanentVideoUrl(permanentUrl);

      // Extract frames immediately after upload
      const extractedFrames = await extractFramesFromVideo(file);
      setFrames(extractedFrames);
      
      // Pass both frames and permanent URL to parent
      console.log('Passing to parent - frames and URL:', {
        framesCount: extractedFrames.length,
        videoUrl: permanentUrl
      });
      onFramesExtracted(extractedFrames, permanentUrl);

    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload video');
    }
  };

  // Extract frames from video
  const extractFrames = async () => {
    if (!video) return;
    
    console.log('Starting frame extraction, permanent URL:', permanentVideoUrl); // Debug log
    setLoading(true);
    setError('');

    try {
      const extractedFrames = await extractFramesFromVideo(video);
      setFrames(extractedFrames);
      onFramesExtracted(extractedFrames, permanentVideoUrl); // Use the stored permanent URL
      console.log('Frames extracted, passed URL to parent:', permanentVideoUrl);
    } catch (error) {
      console.error('Frame extraction error:', error);
      setError('Failed to extract frames');
    } finally {
      setLoading(false);
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

      {/* Extract Frames Button */}
      <button
        onClick={extractFrames}
        disabled={!video || loading}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg
                 disabled:bg-gray-300 disabled:cursor-not-allowed
                 hover:bg-blue-700 transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          'Extract Frames'
        )}
      </button>

      {/* Render Frame Thumbnails */}
      {renderFrameThumbnails()}
    </div>
  );
}