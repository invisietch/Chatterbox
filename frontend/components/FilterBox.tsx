import Select, { MultiValue } from 'react-select';
import { useState, useEffect, useRef } from 'react';
import { FilterIcon } from '@heroicons/react/outline'; // Import the filter icon
import apiClient from '../lib/api';
import TagSelector from './TagSelector';
import Avatar from './Avatar';

const FilterBox = ({ onFilterChange }: { onFilterChange: (filters: any) => void }) => {
  const [filters, setFilters] = useState({
    tags: [] as any[],
    characterIds: [] as number[],
    personaIds: [] as number[],
    promptIds: [] as number[],
  });
  const [characters, setCharacters] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [showFilters, setShowFilters] = useState(false); // Toggle visibility of filters
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

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

  const handleMultiSelectChange = (
    key: string,
    selectedOptions: MultiValue<{ value: any; label: any }>
  ) => {
    const ids = selectedOptions.map((option) => option.value);
    const updatedFilters = { ...filters, [key]: ids };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleTagChange = (tags: any[]) => {
    const updatedFilters = { ...filters, tags };
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
        <div
          className="absolute top-full left-auto right-0 mt-2 p-4 bg-dark border border-dark1 rounded shadow-lg z-50 w-80"
          ref={dropdownRef}
        >
          {/* Tag Filter */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">Tags (AND)</h3>
            <TagSelector
              selectedTags={filters.tags}
              onTagChange={handleTagChange}
              defaultColor={'#3C3836'}
            />
          </div>

          {/* Character Filter */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">Characters (OR)</h3>
            <Select
              isMulti
              closeMenuOnSelect={false}
              value={filters.characterIds.map((id) => ({
                value: id,
                label: (
                  <div className="flex items-center gap-2">
                    <Avatar id={id} name={characters.find((char) => char.id === id)?.name} type="character" size={24} />
                    {characters.find((char) => char.id === id)?.name || id}
                  </div>
                ),
              }))}
              options={characters.map((char: any) => ({
                value: char.id,
                label: (
                  <div className="flex items-center gap-2">
                    <Avatar id={char.id} name={char.name} type="character" size={24} />
                    {char.name}
                  </div>
                ),
              }))}
              onChange={(selected) => handleMultiSelectChange('characterIds', selected)}
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#1D2021',
                  borderColor: '#4a5568',
                  color: '#e2e8f0',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#1D2021',
                  color: '#e2e8f0',
                  zIndex: 9999, // Ensure it appears above everything else
                }),
                option: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: isFocused ? '#3C3836' : '#1D2021',
                  color: '#e2e8f0',
                }),
              }}
            />
          </div>

          {/* Persona Filter */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">Personas (OR)</h3>
            <Select
              isMulti
              closeMenuOnSelect={false}
              value={filters.personaIds.map((id) => ({
                value: id,
                label: (
                  <div className="flex items-center gap-2">
                    <Avatar id={id} name={personas.find((persona) => persona.id === id)?.name} type="persona" size={24} />
                    {personas.find((persona) => persona.id === id)?.name || id}
                  </div>
                ),
              }))}
              options={personas.map((persona: any) => ({
                value: persona.id,
                label: (
                  <div className="flex items-center gap-2">
                    <Avatar id={persona.id} name={persona.name} type="persona" size={24} />
                    {persona.name}
                  </div>
                ),
              }))}
              onChange={(selected) => handleMultiSelectChange('personaIds', selected)}
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#1D2021',
                  borderColor: '#4a5568',
                  color: '#e2e8f0',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#1D2021',
                  color: '#e2e8f0',
                  zIndex: 9999,
                }),
                option: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: isFocused ? '#3C3836' : '#1D2021',
                  color: '#e2e8f0',
                }),
              }}
            />
          </div>

          {/* Prompt Filter */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">Prompts (OR)</h3>
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
                  backgroundColor: '#1D2021',
                  borderColor: '#4a5568',
                  color: '#e2e8f0',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#1D2021',
                  color: '#e2e8f0',
                  zIndex: 9999,
                }),
                option: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: isFocused ? '#3C3836' : '#1D2021',
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
