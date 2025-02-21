export const tireBrands = [
  'Michelin',
  'Continental',
  'Bridgestone',
  'Goodyear',
  'Pirelli',
  'Dunlop',
  'Hankook',
  'Yokohama'
] as const;

export type TireBrand = typeof tireBrands[number];

export const tireModels: Record<TireBrand, string[]> = {
  'Michelin': ['Pilot Sport 4S', 'Pilot Sport Cup 2', 'Primacy 4'],
  'Continental': ['SportContact 7', 'EcoContact 6', 'PremiumContact 6'],
  'Bridgestone': ['Potenza Sport', 'Turanza T005', 'Weather Control A005'],
  'Goodyear': ['Eagle F1', 'Efficient Grip', 'Vector 4Seasons'],
  'Pirelli': ['P Zero', 'Cinturato P7', 'Scorpion Verde'],
  'Dunlop': ['Sport Maxx RT2', 'SP Sport Maxx', 'SP Winter Sport'],
  'Hankook': ['Ventus S1 Evo3', 'Kinergy Eco2', 'Winter i*cept'],
  'Yokohama': ['Advan Sport V105', 'BluEarth-GT', 'Geolandar']
};