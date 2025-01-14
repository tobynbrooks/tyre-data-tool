export interface TireMetadata {
    // Tire Position
    position: 'FL' | 'FR' | 'RL' | 'RR';  // Front Left, Front Right, Rear Left, Rear Right
  
    // Measurements
    leftRegionDepth: number;    // mm
    centerRegionDepth: number;  // mm
    rightRegionDepth: number;   // mm
  
    // Tire Details
    brand: string;             // e.g., Michelin, Bridgestone
    model: string;             // e.g., Pilot Sport 4
    size: string;             // e.g., 225/45R17
    
    // Vehicle Info
    vehicle: {
      make: string;           // e.g., Toyota
      model: string;          // e.g., Camry
      year: number;           // e.g., 2020
    };
  
    // Conditions
    weather: {
      condition: string;      // e.g., Dry, Wet, Snow
      temperature: number;    // Celsius
    };
    tireCleanliness: string;  // e.g., Clean, Dirty, Very Dirty
    lightingCondition: string; // e.g., Good, Poor
  
    // Assessment
    damageType: 'none' | 'surface' | 'structural' | 'wear';  // Replace hasDamage boolean
    damageDescription?: string;                              // Keep this the same
    
    // Technical Details
    measurementDevice: string; // e.g., Manual gauge, Laser scanner
    timestamp: Date;
    location?: string;        // Optional GPS coordinates or location name
  
    // Additional
    notes?: string;           // Any other observations
    mileage?: number;         // Vehicle mileage at time of measurement
  
    // Custom fields for brand/model
    customBrand?: string;  // Optional field for custom brand names
    customModel?: string;  // Optional field for custom model names
  
    // Load and Speed
    loadIndex: string;    // e.g., "91"
    speedRating: string;  // e.g., "Y"
  }

export interface ExtractedFrame {
  frameNumber: number;
  blob: Blob;
  url: string;
}