'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import type { ExtractedFrame } from '../types/types';
import { cloudinaryClient } from '../lib/cloudinary/client';
import Image from 'next/image';

interface VideoUploaderProps {
  onFramesExtracted: (frames: ExtractedFrame[], videoUrl: string, deviceType?: string) => void;
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

interface UploadResponse {
  urls: string[];
}

interface VideoUploadResponse {
  videoUrl: string;
}

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

          // Upload frame to Cloudinary
          const formData = new FormData();
          formData.append('file', blob);
          
          const uploadResponse = await fetch('/api/upload-frame', {
            method: 'POST',
            body: formData,
          });

          const { secure_url } = await uploadResponse.json();
          
          frames.push({
            frameNumber: currentFrame,
            blob,
            url: URL.createObjectURL(blob),
            cloudinaryUrl: secure_url
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
  const [localFrames, setLocalFrames] = useState<ExtractedFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const processVideo = async (file: File) => {
    try {
      setLoading(true);
      setError('');

      // Create video preview
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
      setVideo(file);

      // Extract frames locally first
      console.log('Extracting frames...');
      const extractedFrames = await extractFramesFromVideo(file);
      
      // Create local URLs for immediate preview
      const localPreviewFrames = extractedFrames.map((frame, index) => ({
        ...frame,
        frameNumber: index,
        url: URL.createObjectURL(frame.blob)
      }));

      setLocalFrames(localPreviewFrames);
      console.log(`Extracted ${localPreviewFrames.length} frames`);

      // Upload in chunks to avoid size limits
      const chunkSize = 5; // number of frames per chunk
      const chunks: FormData[] = [];
      
      for (let i = 0; i < extractedFrames.length; i += chunkSize) {
        const chunk = extractedFrames.slice(i, i + chunkSize);
        const formData = new FormData();
        
        chunk.forEach((frame, index) => {
          formData.append(`frame${i + index}`, frame.blob);
        });
        
        chunks.push(formData);
      }

      // Upload chunks sequentially
      const frameUrls: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const response = await fetch('/api/upload-frame', {
          method: 'POST',
          body: chunks[i],
        });
        const { urls } = await response.json() as UploadResponse;
        frameUrls.push(...urls);
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / chunks.length) * 100));
      }

      // Upload video separately
      const videoFormData = new FormData();
      videoFormData.append('video', file);
      const videoResponse = await fetch('/api/upload-video', {
        method: 'POST',
        body: videoFormData,
      });
      const { videoUrl: cloudinaryVideoUrl } = await videoResponse.json() as VideoUploadResponse;

      // Create final frames array
      const finalFrames = extractedFrames.map((frame, index) => ({
        ...frame,
        frameNumber: index,
        cloudinaryUrl: frameUrls[index],
        url: localPreviewFrames[index].url
      }));

      onFramesExtracted(finalFrames, cloudinaryVideoUrl, file.type.split('/')[0]);
      console.log('Upload complete!');

    } catch (error) {
      console.error('Processing error:', error);
      setError('Failed to process video');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processVideo(file);
  };

  const renderFrameThumbnails = useCallback(() => {
    if (localFrames.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          Extracted Frames ({localFrames.length})
          {loading && uploadProgress > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              Uploading: {uploadProgress}%
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {localFrames.map((frame) => (
            <div 
              key={frame.frameNumber}
              className="relative bg-gray-100 rounded-lg overflow-hidden"
              style={{ minHeight: '200px' }}
            >
              <img
                src={frame.url}
                alt={`Frame ${frame.frameNumber + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                Frame {frame.frameNumber + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [localFrames, loading, uploadProgress]);

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
          {videoPreview ? (
            <div className="relative w-full max-w-md aspect-video">
              <video
                src={videoPreview}
                className="w-full h-full object-cover rounded-lg"
                controls
                muted
              />
            </div>
          ) : (
            <>
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
                Upload video
              </span>
            </>
          )}
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Processing video...</span>
        </div>
      )}

      {/* Render Frame Thumbnails */}
      {renderFrameThumbnails()}
    </div>
  );
}