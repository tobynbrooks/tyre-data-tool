interface TireMeasurementsProps {
  leftDepth: number | null;
  centerDepth: number | null;
  rightDepth: number | null;
  onChange: (field: string, value: number | null) => void;
}

export function TireMeasurementsSection({ leftDepth, centerDepth, rightDepth, onChange }: TireMeasurementsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Left Depth (mm)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={leftDepth ?? ''}
          onChange={(e) => onChange('leftRegionDepth', e.target.value ? parseFloat(e.target.value) : null)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="1.9"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Center Depth (mm)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={centerDepth ?? ''}
          onChange={(e) => onChange('centerRegionDepth', e.target.value ? parseFloat(e.target.value) : null)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="1.9"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Right Depth (mm)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={rightDepth ?? ''}
          onChange={(e) => onChange('rightRegionDepth', e.target.value ? parseFloat(e.target.value) : null)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="1.9"
        />
      </div>
    </div>
  );
}
