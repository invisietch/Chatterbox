import { useEffect, useState } from 'react';
import Accordion from './Accordion';
import TagSelector from './TagSelector';
import apiClient from '../lib/api';
import { toast } from 'react-toastify';
import { ColorSwatchIcon } from '@heroicons/react/outline';
import ReactDOM from 'react-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/outline';
import { SortedTags } from './SortedTags';

const suggestedColors = [
  '#b57614',
  '#076678',
  '#8f3f71',
  '#427b58',
  '#af3a03',
  '#cc241d',
  '#98971a',
  '#d79921',
  '#458588',
  '#b16286',
  '#689d6a',
  '#d65d0e',
];

const TagCategoryItem = ({ category, fetchCategories }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const [tags, setTags] = useState(category.tags || []);
  const [removedTags, setRemovedTags] = useState<any[]>([]);
  const [newTags, setNewTags] = useState<any[]>([]);

  useEffect(() => {
    setName(category.name);
    setTags(category.tags);
    setColor(category.color);
  }, [category]);

  const handleSave = async () => {
    try {
      await apiClient.put(`/tag_categories/${name}`, { color });

      for (const tag of removedTags) {
        await apiClient.delete(`/tag_categories/${name}/tag/${tag.name}`);
      }

      for (const tag of newTags) {
        await apiClient.post(`/tag_categories/${name}/tag/${tag.name}`);
      }

      toast.success('Category updated successfully.');
      fetchCategories();
      setIsEditing(false);
    } catch (_error) {
      toast.error('Failed to save category.');
    }
  };

  const handleDelete = async () => {
    try {
      for (const tag of tags) {
        await apiClient.delete(`/tag_categories/${name}/tag/${tag.name}`);
      }

      await apiClient.delete(`/tag_categories/${name}`);
      toast.success('Category deleted successfully.');
      fetchCategories();
    } catch (_error) {
      toast.error('Failed to delete category.');
    }
  };

  const handleCancel = async () => {
    setIsEditing(false);
    fetchCategories(); // Reset accordion color.
  };

  const triggerColorPicker = () => {
    const colorPicker = document.getElementById('color-picker');
    if (colorPicker) {
      colorPicker.click(); // Programmatically open the color picker
    }
  };

  const handleTagChange = (handleTags: any[]) => {
    for (const tag of handleTags) {
      // Handle adding tags that haven't been added.
      if (!newTags.some((t) => t.name === tag.name) && !tags.some((t) => t.name === tag.name)) {
        setNewTags([...newTags, tag]);
      }

      // Remove re-added tags from removedTags.
      if (removedTags.some((t) => t.name === tag.name)) {
        setRemovedTags(removedTags.filter((t) => t.name !== tag.name));
      }
    }

    // Remove tags that aren't in the newly handled tags array.
    for (const tag of tags) {
      if (
        !handleTags.some((t) => t.name === tag.name) &&
        !removedTags.some((t) => t.name === tag.name)
      ) {
        setRemovedTags([...removedTags, tag]);
      }
    }

    // Remove newly deleted tags from newTags.
    for (const tag of newTags) {
      if (!handleTags.some((t) => t.name === tag.name)) {
        setNewTags(newTags.filter((t) => t.name !== tag.name));
      }
    }
  };

  return (
    <>
      <Accordion title={name} color={color}>
        {isEditing ? (
          <div>
            {/* Editing Mode */}
            <div className="pb-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded bg-dark text-gray-200 mb-2"
                disabled
              />
            </div>
            <div className="pb-1 relative">
              <h3>Color</h3>
            </div>

            {/* Suggested Colors + Custom Picker */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {suggestedColors.map((suggestedColor) => (
                <button
                  key={suggestedColor}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === suggestedColor ? 'border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: suggestedColor }}
                  onClick={() => setColor(suggestedColor)}
                />
              ))}
              {/* Color Picker Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={triggerColorPicker}
                  className={`w-8 h-8 rounded-full border-2 ${!suggestedColors.some((col) => col === color) ? 'border-white' : 'border-transparent'} flex justify-center items-center bg-gray-700 hover:bg-gray-600`}
                  style={{
                    backgroundColor: !suggestedColors.some((col) => col === color)
                      ? color
                      : '#ffffff',
                  }}
                >
                  <ColorSwatchIcon className="w-6 h-6 text-gray-200" />
                </button>
                {/* Always Render Color Picker */}
                <input
                  type="color"
                  id="color-picker"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute left-0 top-0 w-8 h-8 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <TagSelector
              selectedTags={[...tags, ...newTags].filter(
                (t) => !removedTags.some((tag) => t.name === tag.name)
              )}
              onTagChange={handleTagChange}
              defaultColor="#3c3c3c"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-fadedGreen text-white rounded hover:bg-brightGreen"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Viewing Mode */}
            <div className="flex space-x-2 absolute top-1 right-1">
              <button
                onClick={() => setIsEditing(true)}
                className="text-grey-300 hover:text-yellow-300"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsDeleting(true)}
                className="text-grey-300 hover:text-red-300"
                aria-label="Delete message"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
            <SortedTags
              tags={tags.map((tag) => {
                return { name: tag.name, category: { name, color } };
              })}
            />
          </div>
        )}
      </Accordion>
      {isDeleting &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 flex items-center justify-center bg-dark2 bg-opacity-50">
            <div className="bg-dark p-6 rounded-lg max-w-sm w-full">
              <h3 className="text-lg font-bold text-white mb-4">
                Are you sure you want to delete this prompt?
              </h3>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsDeleting(false)}
                  className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-fadedRed text-white rounded hover:bg-brightRed"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default TagCategoryItem;
