interface TireMeasurementsProps {
  leftDepth: number | null;
  centerDepth: number | null;
  rightDepth: number | null;
  secondLeftDepth: number | null;
  secondCenterDepth: number | null;
  secondRightDepth: number | null;
  onChange: (field: string, value: number | null) => void;
}

export function TireMeasurementsSection({
  leftDepth,
  centerDepth,
  rightDepth,
  secondLeftDepth,
  secondCenterDepth,
  secondRightDepth,
  onChange,
}: TireMeasurementsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">First measurement</h2>
        <div className="grid grid-cols-3 gap-4">
          <DepthInput
            label="Left Depth (mm)"
            value={leftDepth}
            onChange={(value) => onChange('leftRegionDepth', value)}
          />
          <DepthInput
            label="Center (mm)"
            value={centerDepth}
            onChange={(value) => onChange('centerRegionDepth', value)}
          />
          <DepthInput
            label="Right Depth (mm)"
            value={rightDepth}
            onChange={(value) => onChange('rightRegionDepth', value)}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Second measurement</h2>
        <div className="grid grid-cols-3 gap-4">
          <DepthInput
            label="Left Depth (mm)"
            value={secondLeftDepth}
            onChange={(value) => onChange('secondLeftRegionDepth', value)}
          />
          <DepthInput
            label="Center (mm)"
            value={secondCenterDepth}
            onChange={(value) => onChange('secondCenterRegionDepth', value)}
          />
          <DepthInput
            label="Right Depth (mm)"
            value={secondRightDepth}
            onChange={(value) => onChange('secondRightRegionDepth', value)}
          />
        </div>
      </div>
    </div>
  );
}

interface DepthInputProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}

function DepthInput({ label, value, onChange }: DepthInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value ? parseFloat(event.target.value) : null)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        placeholder="1.9"
      />
    </div>
  );
}
