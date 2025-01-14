'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { ExtractedFrame } from '../types/types';

interface VideoUploaderProps {
  onFramesExtracted: (frames: ExtractedFrame[]) => void;
}

export default function VideoUploader({ onFramesExtracted }: VideoUploaderProps) {
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadFFmpeg();
  }, []);

  // Initialize FFmpeg
  const loadFFmpeg = async () => {
    try {
      const ffmpeg = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      ffmpegRef.current = ffmpeg;
    } catch (err) {
      setError('Failed to load video processor. Please try again.');
    }
  };

  // Handle video file selection
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB');
      return;
    }

    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    setError('');
  };

  // Extract frames from video
  const extractFrames = async () => {
    if (!video || !ffmpegRef.current) return;
    setLoading(true);
    setError('');

    try {
      const ffmpeg = ffmpegRef.current;
      
      await ffmpeg.writeFile('input.mp4', await fetchFile(video));

      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vf', 'select=eq(n\\,0)+eq(n\\,25)+eq(n\\,50)+eq(n\\,75)+eq(n\\,100)',
        '-vsync', '0',
        '-frame_pts', '1',
        'frame_%d.jpg'
      ]);

      const extractedFrames: ExtractedFrame[] = [];
      for (let i = 0; i < 5; i++) {
        const frameData = await ffmpeg.readFile(`frame_${i}.jpg`);
        const blob = new Blob([frameData], { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        
        extractedFrames.push({
          frameNumber: i,
          blob,
          url,
        });
      }

      setFrames(extractedFrames);
      onFramesExtracted(extractedFrames);
    } catch (error) {
      setError('Failed to extract frames. Please try again.');
      console.error('Error extracting frames:', error);
    } finally {
      setLoading(false);
    }
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

      {/* Extracted Frames Grid */}
      {frames.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Extracted Frames</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {frames.map((frame) => (
              <div key={frame.frameNumber} className="relative aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={frame.url}
                  alt={`Frame ${frame.frameNumber + 1}`}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  Frame {frame.frameNumber + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}