import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import apiClient from '../lib/api';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/outline';
import AddPresetForm from '../components/AddPresetForm';
import PresetList from '../components/PresetList';

export default function PresetsPage() {
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [presets, setPresets] = useState([]);
  const [error, _setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const response = await apiClient.get('/presets');
      if (!response.data) {
        throw new Error(`Failed to fetch presets: ${response.statusText}`);
      }
      const data = response.data;
      const sortedPresets = data.sort((a, b) => a.name.localeCompare(b.name));
      setPresets(sortedPresets);
    } catch (_error) {
      toast.error('Failed to fetch preset list.');
    }
  };

  const handleOnCancel = () => {
    setIsAddingPreset(false);
  };

  const handleSavePreset = async (
    name: string,
    samplers: Record<string, any>,
    samplerOrder: number[],
    model: string,
    llmUrl: string,
    maxContext: number,
    engine: string,
    apiKey: string
  ) => {
    try {
      const response = await apiClient.post('/presets', {
        name,
        samplers,
        sampler_order: samplerOrder,
        model_name: model,
        llm_url: llmUrl,
        max_context: maxContext,
        engine,
        api_key: apiKey,
      });

      if (response.status === 200 || response.status === 201) {
        toast.success('Preset saved successfully.');
        setIsAddingPreset(false);
        fetchPresets();
      } else {
        throw new Error(`Failed to save preset: ${response.statusText}`);
      }
    } catch (_error) {
      toast.error('Failed to save preset.');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Presets</h1>
          <button
            className="bg-fadedGreen text-white px-4 py-2 rounded hover:bg-brightGreen"
            onClick={() => setIsAddingPreset(true)}
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>
        {isAddingPreset && <AddPresetForm onSave={handleSavePreset} onCancel={handleOnCancel} />}
        <PresetList presets={presets} error={error} fetchPresets={fetchPresets} />
      </div>
    </Layout>
  );
}
