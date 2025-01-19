import Select, { MultiValue } from 'react-select';
import { useState, useEffect } from 'react';
import { FilterIcon } from '@heroicons/react/outline'; // Import the filter icon
import apiClient from '../lib/api';
import TagPill from './TagPill';

const FilterBox = ({ onFilterChange }: { onFilterChange: (filters: any) => void }) => {
  const [filters, setFilters] = useState({
    tags: [] as string[],
    characterIds: [] as number[],
    personaIds: [] as number[],
    promptIds: [] as number[],
  });
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [characters, setCharacters] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [showFilters, setShowFilters] = useState(false); // Toggle visibility of filters

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [charactersRes, personasRes, promptsRes] = await Promise.all([
          apiClient.get('/characters'),
          apiClient.get('/personas'),
          apiClient.get('/prompts'),
        ]);

        setCharacters(charactersRes.data);
        setPersonas(personasRes.data);
        setPrompts(promptsRes.data);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  const fetchTagSuggestions = async (query: string) => {
    if (query.length < 3) {
      setTagSuggestions([]);
      return;
    }
    try {
      const response = await apiClient.get('/tags', { params: { search: query } });
      setTagSuggestions(response.data.map((tag: any) => tag.name));
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
    }
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
    if (e.target.value.length >= 3) {
      fetchTagSuggestions(e.target.value);
    } else {
      setTagSuggestions([]);
    }
  };

  const handleAddTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      const updatedTags = [...filters.tags, tag];
      setFilters({ ...filters, tags: updatedTags });
      onFilterChange({ ...filters, tags: updatedTags });
    }
    setTagInput('');
    setTagSuggestions([]);
  };

  const handleRemoveTag = (tag: string) => {
    const updatedTags = filters.tags.filter((t) => t !== tag);
    setFilters({ ...filters, tags: updatedTags });
    onFilterChange({ ...filters, tags: updatedTags });
  };

  const handleMultiSelectChange = (
    key: string,
    selectedOptions: MultiValue<{ value: any; label: any }>
  ) => {
    const ids = selectedOptions.map((option) => option.value);
    const updatedFilters = { ...filters, [key]: ids };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <div className="relative">
      {/* Button to toggle filter visibility */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="bg-dark1 text-white px-4 py-2 rounded hover:bg-dark2 flex items-center gap-2"
      >
        <FilterIcon className="h-6 w-6" /> {/* Add the filter icon */}
      </button>

      {/* Filter dropdown */}
      {showFilters && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-dark border border-dark1 rounded shadow-lg z-50 w-80">
          {/* Tag Filter */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">Tags</h3>
            <input
              type="text"
              placeholder="Type to search tags..."
              value={tagInput}
              onChange={handleTagInput}
              className="w-full p-2 border rounded bg-dark text-gray-200"
            />
            {tagSuggestions.length > 0 && (
              <div className="bg-dark border border-gray-600 rounded mt-2">
                {tagSuggestions.map((tag) => (
                  <div
                    key={tag}
                    className="p-2 cursor-pointer hover:bg-dark"
                    onClick={() => handleAddTag(tag)}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap mt-2">
              {filters.tags.map((tag) => (
                <TagPill key={tag} tag={tag} onRemove={handleRemoveTag} />
              ))}
            </div>
          </div>

          {/* Character Filter */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">Characters</h3>
            <Select
              isMulti
              closeMenuOnSelect={false}
              value={filters.characterIds.map((id) => ({
                value: id,
                label: characters.find((char) => char.id === id)?.name || id,
              }))}
              options={characters.map((char: any) => ({ value: char.id, label: char.name }))}
              onChange={(selected) => handleMultiSelectChange('characterIds', selected)}
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#2d3748',
                  borderColor: '#4a5568',
                  color: '#e2e8f0',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#2d3748',
                  color: '#e2e8f0',
                  zIndex: 9999, // Ensure it appears above everything else
                }),
                option: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: isFocused ? '#4a5568' : '#2d3748',
                  color: '#e2e8f0',
                }),
              }}
            />
          </div>

          {/* Persona Filter */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">Personas</h3>
            <Select
              isMulti
              closeMenuOnSelect={false}
              value={filters.personaIds.map((id) => ({
                value: id,
                label: personas.find((persona) => persona.id === id)?.name || id,
              }))}
              options={personas.map((persona: any) => ({ value: persona.id, label: persona.name }))}
              onChange={(selected) => handleMultiSelectChange('personaIds', selected)}
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#2d3748',
                  borderColor: '#4a5568',
                  color: '#e2e8f0',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#2d3748',
                  color: '#e2e8f0',
                  zIndex: 9999,
                }),
                option: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: isFocused ? '#4a5568' : '#2d3748',
                  color: '#e2e8f0',
                }),
              }}
            />
          </div>

          {/* Prompt Filter */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">Prompts</h3>
            <Select
              isMulti
              closeMenuOnSelect={false}
              value={filters.promptIds.map((id) => ({
                value: id,
                label: prompts.find((prompt) => prompt.id === id)?.name || id,
              }))}
              options={prompts.map((prompt: any) => ({ value: prompt.id, label: prompt.name }))}
              onChange={(selected) => handleMultiSelectChange('promptIds', selected)}
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#2d3748',
                  borderColor: '#4a5568',
                  color: '#e2e8f0',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#2d3748',
                  color: '#e2e8f0',
                  zIndex: 9999,
                }),
                option: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: isFocused ? '#4a5568' : '#2d3748',
                  color: '#e2e8f0',
                }),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBox;
