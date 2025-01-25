import { useState, useEffect } from 'react';
import axios from 'axios';
import { PencilIcon } from '@heroicons/react/outline';
import { toast } from 'react-toastify';

export const ModelSearch = ({
  model,
  onModelSelect,
}: {
  model?: string;
  onModelSelect: (model: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');

  useEffect(() => {
    const fetchModels = async () => {
      if (searchTerm.length < 3) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      try {
        const response = await axios.get(
          `https://huggingface.co/api/models?search=${searchTerm}&limit=5`
        );
        setResults(response.data);
      } catch (_error) {
        toast.error('Error fetching models.');
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchModels, 200);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  useEffect(() => {
    if (model) {
      setSelectedModel(model);
      setIsEditing(false);
    }
  }, [model]);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    onModelSelect(modelId); // Pass the selected model back to the parent
    setResults([]);
    setSearchTerm('');
    setIsEditing(false);
  };

  const changeModel = () => {
    setIsEditing(true);
  };

  return (
    <div className="relative">
      {isEditing ? (
        <input
          type="text"
          placeholder="Search for a model..."
          className="w-full p-2 border rounded bg-dark text-gray-200 mb-2 pl-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      ) : (
        <div className="flex items-center space-x-2">
          <span className="truncate w-full text-gray-200" title={selectedModel}>
            {selectedModel.length > 60
              ? `${selectedModel.substring(0, 55)}...`
              : selectedModel || 'Select a model'}
          </span>
          <button onClick={changeModel} className="text-grey-300 hover:text-yellow-300">
            <PencilIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute bg-dark text-gray-200 border border-gray-600 rounded mt-2 w-full z-10 max-h-40 overflow-y-auto">
          {results.map((result) => (
            <div
              key={result.id}
              className="p-2 hover:bg-dark1 cursor-pointer"
              onClick={() => handleSelectModel(result.id)}
            >
              {result.id}
            </div>
          ))}
        </div>
      )}

      {isSearching && searchTerm.length >= 3 && (
        <div className="absolute mt-2 text-gray-400">Searching...</div>
      )}
    </div>
  );
};
