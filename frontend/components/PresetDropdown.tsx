import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPreset, setSelectedPresetId } from '../context/modelSlice';
import { RootState } from '../context/store';
import apiClient from '../lib/api';
import { toast } from 'react-toastify';

const PresetDropdown = () => {
  const [presets, setPresets] = useState([]);
  const dispatch = useDispatch();
  const selectedPresetId = useSelector((state: RootState) => state.model.selectedPresetId);

  // Fetch presets from the backend
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const response = await apiClient.get('/presets');
        setPresets(response.data);
      } catch (error) {
        toast.error('Failed to fetch presets.');
      }
    };

    fetchPresets();
  }, []);

  const handleSelectPreset = (presetId: string) => {
    const preset = presets.find((p: any) => p.id === Number(presetId));
    if (!preset) {
      toast.error('Preset not found.');
      return;
    }

    // Persist the selected preset ID in Redux
    dispatch(setSelectedPresetId(presetId));

    // Dispatch the preset details to Redux
    dispatch(
      setPreset({
        selectedModel: preset.model_name,
        samplers: preset.samplers,
        samplerOrder: preset.sampler_order,
        llmUrl: preset.llm_url,
        selectedPresetId: presetId,
      })
    );

    toast.success(`Preset "${preset.name}" selected.`);
  };

  return (
    <div className="relative">
      <select
        className="p-2 border rounded w-full bg-dark text-gray-200"
        value={selectedPresetId || ''}
        onChange={(e) => handleSelectPreset(e.target.value)}
      >
        <option value="" disabled>
          Select a preset
        </option>
        {presets.map((preset: any) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PresetDropdown;
