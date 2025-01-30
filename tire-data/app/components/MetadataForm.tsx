'use client';

import { useState, FormEvent, useEffect } from 'react';
import type { TireMetadata, ExtractedFrame } from '../types/types';
import { tireBrands, tireModels } from '../data/tyreData';

interface MetadataFormProps {
  frames?: ExtractedFrame[];
  videoUrl?: string;
}

export default function MetadataForm({ frames, videoUrl }: MetadataFormProps) {
  console.log('MetadataForm initialized with videoUrl:', videoUrl);

  const [formData, setFormData] = useState<Partial<TireMetadata>>(() => {
    console.log('Initializing form data with videoUrl:', videoUrl);
    return {
      position: undefined,
      leftRegionDepth: 0,
      centerRegionDepth: 0,
      rightRegionDepth: 0,
      brand: '',
      model: '',
      size: '',
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
      measurementDevice: '',
      timestamp: new Date(),
      lightingCondition: 'Good',
      originalVideoUrl: videoUrl || '',
    };
  });

  // Update form data when videoUrl changes
  useEffect(() => {
    console.log('videoUrl changed in MetadataForm:', videoUrl);
    if (videoUrl) {
      setFormData(prev => {
        console.log('Updating formData with new videoUrl:', videoUrl);
        return {
          ...prev,
          originalVideoUrl: videoUrl
        };
      });
    }
  }, [videoUrl]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting form with data:', {
      ...formData,
      videoUrl,
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
        originalVideoUrl: videoUrl || formData.originalVideoUrl,
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
      console.log('Response from server:', data); // Debug log
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save measurement');
      }

      console.log('Success response:', data);
      alert('Measurement saved successfully!');
      
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
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Tire Position
        </label>
        <select
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select position</option>
          <option value="FL">Front Left</option>
          <option value="FR">Front Right</option>
          <option value="RL">Rear Left</option>
          <option value="RR">Rear Right</option>
        </select>
      </div>

      {/* Measurements */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Left Depth (mm)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.leftRegionDepth}
            onChange={(e) => setFormData({ ...formData, leftRegionDepth: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                document.getElementById('center-depth')?.focus();
              }
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Center Depth (mm)
          </label>
          <input
            id="center-depth"
            type="number"
            step="0.1"
            value={formData.centerRegionDepth}
            onChange={(e) => setFormData({ ...formData, centerRegionDepth: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                document.getElementById('right-depth')?.focus();
              }
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Right Depth (mm)
          </label>
          <input
            id="right-depth"
            type="number"
            step="0.1"
            value={formData.rightRegionDepth}
            onChange={(e) => setFormData({ ...formData, rightRegionDepth: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tire Details */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Brand</label>
          <select
            value={formData.brand === 'other' ? 'other' : formData.brand}
            onChange={(e) => setFormData({ 
              ...formData, 
              brand: e.target.value,
              customBrand: e.target.value === 'other' ? '' : undefined 
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            autoFocus
          >
            <option value="">Select brand</option>
            {tireBrands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
            <option value="other">Other</option>
          </select>
          <input
            type="text"
            placeholder="Enter custom brand name"
            value={formData.customBrand || ''}
            onChange={(e) => {
              if (formData.brand === 'other') {
                setFormData({ 
                  ...formData, 
                  customBrand: e.target.value,
                  brand: 'other'  // Keep 'other' selected in dropdown
                });
              }
            }}
            disabled={formData.brand !== 'other' && formData.brand !== ''}
            className={`mt-2 block w-full rounded-md border-gray-300 shadow-sm 
              ${formData.brand !== 'other' && formData.brand !== '' 
                ? 'bg-gray-100 text-gray-500' 
                : 'focus:border-blue-500 focus:ring-blue-500'}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Model</label>
          <select
            value={formData.model === 'other' ? 'other' : formData.model}
            onChange={(e) => setFormData({ 
              ...formData, 
              model: e.target.value,
              customModel: e.target.value === 'other' ? '' : undefined
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={!formData.brand || formData.brand === 'other'}
          >
            <option value="">Select model</option>
            {formData.brand && formData.brand !== 'other' && tireModels[formData.brand as keyof typeof tireModels]?.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
          <input
            type="text"
            value={formData.customModel || ''}
            onChange={(e) => {
              if (formData.model === 'other' || formData.brand === 'other') {
                setFormData({ 
                  ...formData, 
                  customModel: e.target.value,
                  model: formData.model === 'other' ? 'other' : e.target.value
                });
              }
            }}
            className={`mt-2 block w-full rounded-md border-gray-300 shadow-sm 
              ${(formData.model !== 'other' && formData.model !== '' && formData.brand !== 'other') 
                ? 'bg-gray-100 text-gray-500' 
                : 'focus:border-blue-500 focus:ring-blue-500'}`}
            placeholder="Enter custom model name"
            disabled={formData.model !== 'other' && formData.model !== '' && formData.brand !== 'other'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Size</label>
          <input
            id="tire-size"
            type="text"
            value={formData.size}
            onChange={(e) => {
              // Remove any non-numeric and non-R characters
              let value = e.target.value.replace(/[^0-9R]/g, '');
              
              // Add first '/' after the first 3 digits
              if (value.length >= 3) {
                value = value.slice(0, 3) + '/' + value.slice(3);
              }
              
              // Add second '/' after the next 2 digits
              if (value.length >= 6) {
                value = value.slice(0, 6) + '/' + value.slice(6);
              }
              
              // Add 'R' after the next 2 digits if not already present
              if (value.length >= 9 && !value.includes('R')) {
                value = value.slice(0, 9) + 'R' + value.slice(9);
              }
              
              setFormData({ ...formData, size: value });
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="225/45/R17"
          />
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