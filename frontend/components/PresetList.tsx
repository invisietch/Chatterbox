import React from "react";
import PresetItem from "./PresetItem";

const PresetList = ({
  presets,
  error,
  fetchPresets,
}: {
  presets: any[],
  error: string,
  fetchPresets: () => void,
}) => {
  return (
    <>
      {error && <p className="text-red-500">{error}</p>}
      {!error && presets.length === 0 && <p className="text-gray-500">No presets found.</p>}
      <div className="space-y-4">
        {presets.map((preset) => (
          <PresetItem preset={preset} onSave={fetchPresets} />
        ))}
      </div>
    </>
  );
};

export default PresetList;
