export interface TireSize {
  width: number;           // e.g., 225
  aspectRatio: number;     // e.g., 45
  diameter: number;        // e.g., 17
  construction: 'R' | 'B' | 'D';  // Radial, Bias, or Diagonal
}

export interface TireMetadata {
  position: string;  // 'FL', 'FR', 'RL', 'RR', 'SP'
  leftRegionDepth: number | null;
  centerRegionDepth: number | null;
  rightRegionDepth: number | null;
  brand: string;
  model: string;
  customBrand?: string;
  customModel?: string;
  width: number;
  aspectRatio: number;
  diameter: number;
  construction: 'R' | 'B' | 'D';
  loadIndex: string;
  speedRating: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
  };
  weather: {
    condition: string;
    temperature: number;
  };
  tireCleanliness: string;
  damageType: 'none' | 'surface' | 'structural' | 'wear';
  damageDescription?: string;
  measurementDevice: string;
  timestamp: Date;
  lightingCondition: string;
  originalVideoUrl: string;
}

export interface ExtractedFrame {
  frameNumber: number;
  blob: Blob;
  url: string;
  cloudinaryUrl?: string;
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
}

export interface Weather {
  condition: string;
  temperature: number;
}