'use client'
import VideoUploader from './components/VideoUploader';
import MetadataForm from './components/MetadataForm';
import { useState } from 'react';

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [measurementDevice, setMeasurementDevice] = useState<string>('');

  const handleVideoUploaded = (url: string, device?: string) => {
    console.log('Home received:', {
      videoUrl: url,
      measurementDevice: device
    });
    setVideoUrl(url);
    setMeasurementDevice(device || '');
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
            <li>Wait for the video to finish uploading</li>
            <li>Add metadata and submit for analysis</li>
          </ol>
        </div>

        {/* Video Uploader Component */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 !text-black">Upload Tire Video</h2>
            <VideoUploader onVideoUploaded={handleVideoUploaded} />
          </div>
        </div>

        <MetadataForm 
          videoUrl={videoUrl} 
          measurementDevice={measurementDevice}
        />

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Supported formats: MP4, MOV, AVI</p>
          <p>Maximum file size: 100MB</p>
        </footer>
      </div>
    </main>
  );
}