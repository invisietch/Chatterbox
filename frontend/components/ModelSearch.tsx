import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedModel, initialState } from '../context/modelSlice';
import { RootState } from '../context/store';

const ModelSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const dispatch = useDispatch();
  const selectedModel = useSelector((state: RootState) => state.model.selectedModel);

  const handleModelChange = (model: string) => {
    dispatch(setSelectedModel(model));  // Update the selected model in the store
  };

  // Debounced search effect
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
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchModels, 200);

    return () => clearTimeout(debounceTimer); // Cleanup on input change
  }, [searchTerm]);

  // Handle selection
  const handleSelectModel = (modelId: string) => {
    handleModelChange(modelId); // Update global state
    setResults([]); // Clear search results
    setSearchTerm(''); // Clear input field
    setIsEditing(false);
  };

  // Handle reset
  const changeModel = () => {
    setIsEditing(true);
  };

  return (
    <div className="relative">
      {/* Search input */}
      {isEditing ? (
        <input
          type="text"
          placeholder="Search for a model..."
          className="p-2 border rounded w-full bg-gray-700 text-gray-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      ) : (
        <div className="flex items-center space-x-2">
          <span className="truncate w-full text-gray-200" title={selectedModel}>
            {selectedModel.length > 25
              ? `${selectedModel.substring(0, 25)}...`
              : selectedModel}
          </span>
          <button
            onClick={changeModel}
            className="text-blue-400 hover:text-blue-500"
            aria-label="Edit model"
          >
            ✏️
          </button>
        </div>
      )}

      {/* Search results */}
      {results.length > 0 && (
        <div className="absolute bg-gray-800 text-gray-200 border border-gray-600 rounded mt-2 w-full z-10 max-h-40 overflow-y-auto">
          {results.map((result) => (
            <div
              key={result.id}
              className="p-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => handleSelectModel(result.id)}
            >
              {result.id}
            </div>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {isSearching && searchTerm.length >= 3 && (
        <div className="absolute mt-2 text-gray-400">Searching...</div>
      )}
    </div>
  );
};

export default ModelSearch;
