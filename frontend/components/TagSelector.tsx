import React, { useState } from 'react';
import apiClient from '../lib/api'; // Adjust import for your API client
import TagPill from './TagPill';

interface Tag {
  name: string;
  category?: {
    name: string;
    color: string;
  };
}

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagChange: (tags: any) => void;
  defaultColor: string; // Default color if no category color is available
}

const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, onTagChange, defaultColor }) => {
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);

  // Fetch matching tags from the API
  const fetchTagSuggestions = async (query: string) => {
    if (query.length < 3) {
      setTagSuggestions([]);
      return;
    }

    try {
      const response = await apiClient.get('/tags', {
        params: { search: query },
      });
      setTagSuggestions(response.data); // Expecting API to return [{ name, category }]
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
    }
  };

  // Handle tag input changes
  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);

    if (e.target.value.length >= 2) {
      fetchTagSuggestions(e.target.value);
    } else {
      setTagSuggestions([]);
    }
  };

  // Handle keyboard events in the tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim() && !selectedTags.some((tag) => tag.name === tagInput.trim())) {
        onTagChange([...selectedTags, { name: tagInput.trim() }]);
      }
      setTagInput('');
      setTagSuggestions([]);
    } else if (e.key === 'Backspace' && !tagInput && selectedTags.length) {
      const updatedTags = [...selectedTags];
      updatedTags.pop();
      onTagChange(updatedTags);
    }
  };

  // Add tag from suggestions
  const addTag = (tag: Tag) => {
    if (!selectedTags.some((t) => t.name === tag.name)) {
      onTagChange([...selectedTags, tag]);
    }
    setTagInput('');
    setTagSuggestions([]);
  };

  return (
    <div className="tag-selector">
      <div className="input-container relative">
        <div className="flex flex-wrap items-center p-2 border rounded bg-dark text-gray-200">
          {selectedTags.map((tag) => (
            <TagPill
              tag={tag}
              onRemove={(tag: any) => onTagChange(selectedTags.filter(t => t.name !== tag.name))}
              defaultColor={'#3C3836'}
            />
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={handleTagInput}
            onKeyDown={handleTagKeyDown}
            className="flex-1 p-2 bg-dark text-gray-200 border-none focus:outline-none"
            placeholder="Type to search tags..."
          />
        </div>
        {tagSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 border bg-dark border-gray-600 rounded mt-2 z-10">
            {tagSuggestions.map((tag) => (
              <div
                key={tag.name}
                className="p-2 hover:bg-brightGreen cursor-pointer flex items-center"
                style={{ backgroundColor: tag.category?.color || defaultColor }}
                onClick={() => addTag(tag)}
              >
                {tag.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagSelector;
