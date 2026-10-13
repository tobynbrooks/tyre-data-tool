'use client';

import { useState, useRef, useEffect } from 'react';
import { readCameraModel } from '../lib/readCameraModel';

interface VideoUploaderProps {
  onVideoUploaded: (videoUrl: string, measurementDevice?: string) => void;
}

const MAX_FILE_SIZE = 100_000_000;

export default function VideoUploader({ onVideoUploaded }: VideoUploaderProps) {
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSafariIOS, setIsSafariIOS] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
    const isWebKit = /WebKit/i.test(window.navigator.userAgent);
    const notChrome = !/CriOS/i.test(window.navigator.userAgent);
    setIsSafariIOS(isIOS && isWebKit && notChrome);
  }, []);

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

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Video is larger than 100MB');
      }

      const devicePromise = readCameraModel(file);

      const signResponse = await fetch('/api/sign-upload', { method: 'POST' });
      if (!signResponse.ok) {
        throw new Error('Failed to get upload signature');
      }
      const { cloudName, apiKey, signature, params } = await signResponse.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('signature', signature);
      for (const [key, value] of Object.entries(params)) {
        formData.append(key, value as string);
      }
      console.log('🎥 Uploading video:', file.name);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        { method: 'POST', body: formData }
      );

      const responseData = await uploadResponse.json();
      console.log('🎥 Upload response:', responseData);

      if (!uploadResponse.ok || !responseData.secure_url) {
        throw new Error(responseData.error?.message || 'Failed to upload video or get URL');
      }

      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      const measurementDevice = (await devicePromise) ?? 'Unknown Device';
      console.log('🎥 Measurement device:', measurementDevice);
      onVideoUploaded(responseData.secure_url, measurementDevice);

    } catch (error) {
      console.error('📱 ERROR: Upload process failed:', error);
      setError('Failed to upload video: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const createFilePickerComponent = () => {
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

      {/* Upload Status */}
      {loading && (
        <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
          Uploading video...
        </div>
      )}

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
    </div>
  );
}
