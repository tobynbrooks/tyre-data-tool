'use client'
import VideoUploader from './components/VideoUploader';
import MetadataForm from './components/MetadataForm';
import { useState } from 'react';
import type { ExtractedFrame } from './types/types';

export default function Home() {
  const [extractedFrames, setExtractedFrames] = useState<ExtractedFrame[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');

  const handleFramesExtracted = (frames: ExtractedFrame[], url: string) => {
    console.log('Home received frames and URL:', {
      framesCount: frames.length,
      videoUrl: url
    });
    setExtractedFrames(frames);
    setVideoUrl(url);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Tire Video Analysis</h1>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-2">How to use:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Upload a video of your tire (MP4 format recommended)</li>
            <li>Wait for the frames to be extracted</li>
            <li>Review the extracted frames</li>
            <li>Add metadata and submit for analysis</li>
          </ol>
        </div>

        {/* Video Uploader Component */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Tire Video</h2>
            <VideoUploader onFramesExtracted={handleFramesExtracted} />
          </div>
        </div>

        <MetadataForm frames={extractedFrames} videoUrl={videoUrl} />

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Supported formats: MP4, MOV, AVI</p>
          <p>Maximum file size: 100MB</p>
        </footer>
      </div>
    </main>
  );
}