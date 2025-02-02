'use client';

import { useState, FormEvent, useEffect } from 'react';
import type { TireMetadata, ExtractedFrame } from '../types/types';
import { tireBrands, tireModels, type TireBrand } from '../data/tyreData';
import { TireSizeSection } from './tire-form/TireSize';
import { TireMeasurementsSection } from './tire-form/TireMeasurements';

interface MetadataFormProps {
  frames?: ExtractedFrame[];
  videoUrl?: string;
  measurementDevice?: string;
}

export default function MetadataForm({ 
  frames: initialFrames, 
  videoUrl: initialVideoUrl,
  measurementDevice: initialDevice 
}: MetadataFormProps) {
  const [frames] = useState<ExtractedFrame[]>(initialFrames || []);
  
  const [formData, setFormData] = useState<TireMetadata>(() => ({
    position: '',
    leftRegionDepth: null,
    centerRegionDepth: null,
    rightRegionDepth: null,
    brand: '',
    model: '',
    customBrand: '',
    customModel: '',
    width: 0,
    aspectRatio: 0,
    diameter: 0,
    construction: 'R',
    loadIndex: '',
    speedRating: '',
    vehicle: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
    },
    weather: {
      condition: 'Dry',
      temperature: 20,
    },
    tireCleanliness: 'Clean',
    damageType: 'none',
    measurementDevice: initialDevice || '',
    timestamp: new Date(),
    lightingCondition: 'Good',
    originalVideoUrl: initialVideoUrl || '',
  }));

  // Add this new useEffect to handle measurementDevice updates
  useEffect(() => {
    if (initialDevice && initialDevice !== formData.measurementDevice) {
      setFormData(prev => ({
        ...prev,
        measurementDevice: initialDevice
      }));
    }
  }, [initialDevice, formData.measurementDevice]);

  // Existing videoUrl useEffect
  useEffect(() => {
    if (initialVideoUrl && initialVideoUrl !== formData.originalVideoUrl) {
      setFormData(prev => ({
        ...prev,
        originalVideoUrl: initialVideoUrl
      }));
    }
  }, [initialVideoUrl, formData.originalVideoUrl]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting form with data:', {
      ...formData,
      videoUrl: initialVideoUrl,
      originalVideoUrl: formData.originalVideoUrl,
    });

    // Validate required fields before submission
    if (!formData.position) {
      alert('Please select a tire position');
      return;
    }

    // Debug logs
    console.log('Form Data before submission:', {
      position: formData.position,
      leftDepth: formData.leftRegionDepth,
      centerDepth: formData.centerRegionDepth,
      rightDepth: formData.rightRegionDepth,
      brand: formData.brand,
      frames: frames
    });

    try {
      // Prepare submission data with custom brand/model handling
      const submissionData = {
        ...formData,
        frames,
        // Use custom brand if 'other' is selected
        brand: formData.brand === 'other' ? formData.customBrand : formData.brand,
        // Use custom model if 'other' is selected
        model: formData.model === 'other' ? formData.customModel : formData.model,
        originalVideoUrl: initialVideoUrl || formData.originalVideoUrl,
      };

      console.log('Final submission data:', submissionData);

      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save measurement');
      }

      console.log('Success response:', data);
      alert('Measurement saved successfully!');
      
      // Force page reload after successful save
      window.location.reload();
      
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Full error details:', error);
      alert('Failed to save measurement: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const testDatabase = async () => {
    try {
      const response = await fetch('/api/measurements', {
        method: 'GET'
      });
      
      const data = await response.json();
      
      // Add this to check table structure
      const tablesResponse = await fetch('/api/measurements', {
        method: 'GET',
        headers: {
          'x-check-tables': 'true'
        }
      });
      const tablesData = await tablesResponse.json();
      
      console.log('Database test result:', data);
      console.log('Tables structure:', tablesData);
      alert(JSON.stringify({data, tables: tablesData}, null, 2));
      
    } catch (error) {
      console.error('Database test error:', error);
      alert('Database test failed: ' + error);
    }
  };

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFramesExtracted = (
    extractedFrames: ExtractedFrame[], 
    videoUrl: string, 
    measurementDevice?: string
  ) => {
    console.log('Received frames and device:', { 
      framesCount: extractedFrames.length, 
      videoUrl, 
      measurementDevice 
    });
    
    setFormData(prev => ({
      ...prev,
      measurementDevice: measurementDevice || '',
      originalVideoUrl: videoUrl
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-4">
      <button
        type="button"
        onClick={testDatabase}
        className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Test Database Connection
      </button>

      {/* Tire Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tire Position
        </label>
        <select
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Select position</option>
          <option value="FL">Front Left</option>
          <option value="FR">Front Right</option>
          <option value="RL">Rear Left</option>
          <option value="RR">Rear Right</option>
          <option value="SP">Spare</option>
        </select>
      </div>

      <TireMeasurementsSection
        leftDepth={formData.leftRegionDepth}
        centerDepth={formData.centerRegionDepth}
        rightDepth={formData.rightRegionDepth}
        onChange={updateFormField}
      />

      <TireSizeSection
        width={formData.width}
        aspectRatio={formData.aspectRatio}
        diameter={formData.diameter}
        construction={formData.construction}
        onChange={updateFormField}
      />

      {/* Tire Details */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Brand</label>
          <select
            value={formData.brand}
            onChange={(e) => setFormData({ 
              ...formData, 
              brand: e.target.value,
              customBrand: e.target.value === 'other' ? '' : formData.customBrand 
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select brand</option>
            {tireBrands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
            <option value="other">Other</option>
          </select>
          {formData.brand === 'other' && (
            <input
              type="text"
              value={formData.customBrand || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                customBrand: e.target.value 
              })}
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter custom brand"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Model</label>
          <select
            value={formData.model}
            onChange={(e) => setFormData({ 
              ...formData, 
              model: e.target.value,
              customModel: e.target.value === 'other' ? '' : formData.customModel 
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={!formData.brand || formData.brand === 'other'}
          >
            <option value="">Select model</option>
            {formData.brand && formData.brand !== 'other' && tireModels[formData.brand as TireBrand]?.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
            <option value="other">Other</option>
          </select>
          {(formData.model === 'other' || formData.brand === 'other') && (
            <input
              type="text"
              value={formData.customModel || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                customModel: e.target.value 
              })}
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter custom model"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Load & Speed</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.loadIndex}
              onChange={(e) => setFormData({ ...formData, loadIndex: e.target.value })}
              className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="91"
              maxLength={3}
            />
            <input
              type="text"
              value={formData.speedRating}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                if (value === '' || /^[A-Z]$/.test(value)) {
                  setFormData({ ...formData, speedRating: value });
                }
              }}
              className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Y"
              maxLength={1}
            />
          </div>
          <span className="text-xs text-gray-500 mt-1">Load Index & Speed Rating</span>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Vehicle Make</label>
          <input
            type="text"
            value={formData.vehicle?.make}
            onChange={(e) => setFormData({
              ...formData,
              vehicle: { ...formData.vehicle!, make: e.target.value }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Vehicle Model</label>
          <input
            type="text"
            value={formData.vehicle?.model}
            onChange={(e) => setFormData({
              ...formData,
              vehicle: { ...formData.vehicle!, model: e.target.value }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Year</label>
          <input
            type="number"
            value={formData.vehicle?.year}
            onChange={(e) => setFormData({
              ...formData,
              vehicle: { ...formData.vehicle!, year: parseInt(e.target.value) }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Weather and Conditions */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Weather</label>
          <select
            value={formData.weather?.condition}
            onChange={(e) => setFormData({
              ...formData,
              weather: { ...formData.weather!, condition: e.target.value }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="Dry">Dry</option>
            <option value="Wet">Wet</option>
            <option value="Snow">Snow</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tire Cleanliness</label>
          <select
            value={formData.tireCleanliness}
            onChange={(e) => setFormData({ ...formData, tireCleanliness: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="Clean">Clean</option>
            <option value="Dirty">Dirty</option>
            <option value="Very Dirty">Very Dirty</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Lighting</label>
          <select
            value={formData.lightingCondition}
            onChange={(e) => setFormData({ ...formData, lightingCondition: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="Good">Good Lighting</option>
            <option value="Poor">Poor Lighting</option>
          </select>
        </div>
      </div>

      {/* Damage Assessment */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Damage Assessment
        </label>
        <select
          value={formData.damageType || 'none'}
          onChange={(e) => setFormData({ 
            ...formData, 
            damageType: e.target.value as 'none' | 'surface' | 'structural' | 'wear'
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="none">No Visible Damage</option>
          <option value="surface">Surface Damage (cuts, scratches, weather checking)</option>
          <option value="structural">Structural Damage (bulges, impact damage, separation)</option>
          <option value="wear">Wear Damage (uneven wear, flat spots)</option>
        </select>

        {formData.damageType && formData.damageType !== 'none' && (
          <textarea
            value={formData.damageDescription}
            onChange={(e) => setFormData({ ...formData, damageDescription: e.target.value })}
            placeholder="Add additional damage details..."
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        )}
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Metadata
        </button>
      </div>
    </form>
  );
}