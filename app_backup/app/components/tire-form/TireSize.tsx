import { TireSize } from '../../types/types';

interface TireSizeProps {
  width: number;
  aspectRatio: number;
  diameter: number;
  construction: 'R' | 'B' | 'D';
  onChange: (field: string, value: any) => void;
}

export function TireSizeSection({ width, aspectRatio, diameter, construction, onChange }: TireSizeProps) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Tire Size</label>
      <div className="grid grid-cols-4 gap-4">
        {/* Width Column */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Width (mm)</label>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {[175, 185, 195, 205, 215, 225, 235, 245, 255, 265].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onChange('width', w)}
                className="px-2 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100"
              >
                {w}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={width || ''}
            onChange={(e) => onChange('width', parseInt(e.target.value) || 0)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="225"
          />
        </div>

        {/* Aspect Ratio Column */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {[30, 35, 40, 45, 50, 55, 60, 65, 70].map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => onChange('aspectRatio', ratio)}
                className="px-2 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100"
              >
                {ratio}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={aspectRatio || ''}
            onChange={(e) => onChange('aspectRatio', parseInt(e.target.value) || 0)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="45"
          />
        </div>

        {/* Construction Column */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Construction</label>
          <select
            value={construction}
            onChange={(e) => onChange('construction', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="R">R (Radial)</option>
            <option value="B">B (Bias)</option>
            <option value="D">D (Diagonal)</option>
          </select>
        </div>

        {/* Diameter Column */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Diameter (inches)</label>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {[13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChange('diameter', d)}
                className="px-2 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100"
              >
                {d}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={diameter || ''}
            onChange={(e) => onChange('diameter', parseInt(e.target.value) || 0)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="17"
          />
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mt-2">
        Format: {width || '---'}/{aspectRatio || '--'}{construction || 'R'}{diameter || '--'}
      </p>
    </div>
  );
}
