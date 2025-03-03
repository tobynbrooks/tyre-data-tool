'use client';

import { useState, useRef, useEffect } from 'react';
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
  quality: 1.0,
  scaleFactor: 1.0,
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
    
    // Enhanced video settings for mobile
    video.playsInline = true;
    video.muted = true;
    video.autoplay = false;
    video.preload = 'metadata';
    
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', ''); // Older iOS versions
    video.setAttribute('x-webkit-airplay', 'allow');
    
    // Force video to load at highest possible quality on iOS
    if (window.navigator.userAgent.indexOf('iPhone') > -1) {
      video.setAttribute('controls', ''); // Helps Safari use native player
      video.style.width = '100%';
      video.style.height = 'auto';
    }
    
    video.addEventListener('loadstart', () => console.log('📱 VIDEO: loadstart'));
    
    video.addEventListener('loadedmetadata', async () => {
      console.log('📱 VIDEO: loadedmetadata', {
        duration: video.duration,
        dimensions: `${video.videoWidth}x${video.videoHeight}`,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      });

      try {
        // Force high resolution canvas - CRITICAL CHANGE
        // Safari sometimes doesn't respect video dimensions, so we use file
        // properties to estimate the true video resolution
        const estimatedWidth = file.size > 10000000 ? 3840 : 1920; // Use file size to guess resolution
        const estimatedHeight = file.size > 10000000 ? 2160 : 1080;
        
        // If video dimensions are too small, try to force larger canvas
        if (video.videoWidth < 1280 || video.videoHeight < 720) {
          console.log('📱 WARNING: Video dimensions too small, attempting to force higher resolution');
          canvas.width = Math.max(video.videoWidth, estimatedWidth);
          canvas.height = Math.max(video.videoHeight, estimatedHeight);
        } else {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        
        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        // Log the actual dimensions being used
        console.log('Extracting frames at resolution:', {
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        });

        // Set high-quality canvas rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Calculate frames
        const frameInterval = 1 / config.framesPerSecond;
        const totalPossibleFrames = Math.floor(video.duration / frameInterval);
        const maxFrames = Math.min(config.maxFrames, totalPossibleFrames);

        console.log('📱 DEBUG: Starting frame extraction:', {
          frameInterval,
          totalPossibleFrames,
          maxFrames
        });

        // Extract frames
        for (let i = 0; i < maxFrames; i++) {
          const timestamp = i * frameInterval + 0.1;
          console.log(`📱 DEBUG: Processing frame ${i + 1}/${maxFrames} at ${timestamp}s`);
          
          video.currentTime = timestamp;
          await new Promise(resolve => video.addEventListener('seeked', resolve, { once: true }));
          
          // Draw at full resolution
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (blob) => blob ? resolve(blob) : reject(new Error('Blob creation failed')),
              'image/jpeg',
              1.0  // Maximum quality
            );
          });

          console.log(`📱 DEBUG: Frame ${i + 1} processed:`, {
            timestamp,
            blobSize: `${(blob.size / 1024).toFixed(2)} KB`,
            resolution: `${canvas.width}x${canvas.height}`
          });

          frames.push({
            frameNumber: i,
            blob,
            url: URL.createObjectURL(blob)
          });
        }

        console.log('📱 DEBUG: Frame extraction complete:', {
          totalFrames: frames.length
        });
        
        resolve(frames);
      } catch (error) {
        console.error('📱 ERROR:', error);
        reject(error);
      } finally {
        URL.revokeObjectURL(video.src);
      }
    });

    video.addEventListener('error', (e) => {
      console.error('📱 ERROR: Video error:', video.error);
      reject(new Error(`Video error: ${video.error?.message || 'Unknown error'}`));
    });

    const videoUrl = URL.createObjectURL(file);
    console.log('📱 DEBUG: Setting video source:', videoUrl);
    video.src = videoUrl;
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

// Add this hook at the top of your file, outside the component
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent));
    }
  }, []);

  return isMobile;
};

export default function VideoUploader({ onFramesExtracted }: VideoUploaderProps) {
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permanentVideoUrl, setPermanentVideoUrl] = useState<string>('');

  // Try to set high quality camera constraints on component mount
  useEffect(() => {

    if (typeof window === 'undefined') return;

    const setupHighQualityCamera = async () => {
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        console.log('📱 Setting high quality capture constraints for iOS');
        try {
          // Request camera access with high quality first
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 3840, min: 1280 },
              height: { ideal: 2160, min: 720 },
              facingMode: 'environment'
            }
          });
          // Release the stream immediately - we just want to set quality preferences
          stream.getTracks().forEach(track => track.stop());
          console.log('📱 Successfully set camera constraints');
        } catch (e) {
          console.log('📱 Could not set camera constraints:', e);
        }
      }
    };

    setupHighQualityCamera();
  }, []);

  // Handle video file selection
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setError('');
    setUploadProgress({ current: 0, total: 0 });

    try {
      console.log('🎥 File selected:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      });
      
      // For iOS Safari, try to check file quality early
      if (window.navigator.userAgent.indexOf('iPhone') > -1) {
        if (file.size < 1000000) { // Less than 1MB
          console.warn('📱 WARNING: File size indicates very low quality video');
        }
      }

      // First upload video to Cloudinary
      const formData = new FormData();
      formData.append('video', file);
      console.log('🎥 Uploading video:', file.name);

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

      // Now extract frames
      console.log('📱 DEBUG: Extracting frames...');
      const extractedFrames = await extractFramesFromVideo(file);
      
      // Set total frames for progress
      setUploadProgress({ current: 0, total: extractedFrames.length });
      console.log('📱 DEBUG: Uploading frames to Cloudinary...');
      
      // Upload frames with progress
      const framesWithUrls = [];
      for (let i = 0; i < extractedFrames.length; i++) {
        try {
          const frameData = new FormData();
          frameData.append(`frame`, extractedFrames[i].blob, `frame${i}.jpg`);
          
          const uploadResponse = await fetch('/api/upload-frame', {
            method: 'POST',
            body: frameData
          });
          
          if (!uploadResponse.ok) {
            console.error(`📱 ERROR: Failed to upload frame ${i}`);
            continue;
          }
          
          const { urls } = await uploadResponse.json();
          framesWithUrls.push({
            ...extractedFrames[i],
            url: urls[0]
          });
          
          setUploadProgress(prev => ({ ...prev, current: i + 1 }));
        } catch (frameError) {
          console.error(`📱 ERROR: Frame ${i} upload failed:`, frameError);
        }
      }
      
      console.log('📱 DEBUG: Frames uploaded:', {
        count: framesWithUrls.length,
        urls: framesWithUrls.map(f => f.url)
      });
      
      // Only proceed if we have at least one frame
      if (framesWithUrls.length > 0) {
        setFrames(framesWithUrls);
        onFramesExtracted(framesWithUrls, permanentUrl, measurementDevice);
      } else {
        throw new Error('Failed to upload any frames');
      }

    } catch (error) {
      console.error('📱 ERROR: Upload process failed:', error);
      setError('Failed to upload video: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const createFilePickerComponent = () => {

    if (typeof window === 'undefined') return null;

    const [isSafariIOS, setIsSafariIOS] = useState(false);
  
    // Check browser type in useEffect
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const isIOS = /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
        const isWebKit = /WebKit/i.test(window.navigator.userAgent);
        const notChrome = !/CriOS/i.test(window.navigator.userAgent);
        setIsSafariIOS(isIOS && isWebKit && notChrome);
      }
    }, []);
    
    if (!isSafariIOS) return null; {
      return (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">For iOS devices:</h3>  {/* Library selection option */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose from library
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Choose to either record a new video or select from your library
          </p>
        </div>
      );
    }
    
    return null;
  };

  const renderFrameThumbnails = () => {
    const isMobile = useIsMobile();
    
    console.log('📱 DEBUG: Render attempt:', {
      framesLength: frames.length,
      isMobile: isMobile
    });

    if (frames.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Extracted Frames</h3>
        <div className={`grid ${
          isMobile 
            ? 'grid-cols-2 gap-2' 
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'
        }`}>
          {frames.map((frame) => (
            <div 
              key={frame.frameNumber} 
              className="relative bg-gray-100 rounded-lg overflow-hidden"
              style={{ aspectRatio: '16/9' }}  // Force aspect ratio
            >
              <img
                src={frame.url}
                alt={`Frame ${frame.frameNumber + 1}`}
                className="absolute inset-0 w-full h-full object-contain"
                loading="lazy"
                onError={(e) => {
                  console.error('📱 ERROR: Frame load failed:', {
                    frameNumber: frame.frameNumber,
                    url: frame.url
                  });
                }}
                onLoad={() => {
                  console.log('📱 SUCCESS: Frame loaded:', {
                    frameNumber: frame.frameNumber
                  });
                }}
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

      {/* iOS-specific file picker with capture attribute */}
      {createFilePickerComponent()}

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

      {/* Add this after the video preview */}
      {loading && uploadProgress.total > 0 && (
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span>Uploading frames</span>
            <span>{uploadProgress.current} of {uploadProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Render Frame Thumbnails */}
      {renderFrameThumbnails()}
    </div>
  );
}