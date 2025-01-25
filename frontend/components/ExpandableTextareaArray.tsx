import { useState } from 'react';
import ExpandableTextarea from './ExpandableTextarea';
import { PlusIcon } from '@heroicons/react/outline';

interface ExpandableTextareaArrayProps {
  label: string;
  itemLabel: string;
  initialArray: string[];
  onArrayChange: (array: string[]) => void;
}

export const ExpandableTextareaArray: React.FC<ExpandableTextareaArrayProps> = ({
  label,
  itemLabel,
  initialArray,
  onArrayChange,
}) => {
  const [textareas, setTextareas] = useState<string[]>(initialArray);

  const handleAddTextarea = () => {
    const newArray = [...textareas, ''];
    setTextareas(newArray);
    onArrayChange(newArray);
  };

  const handleTextareaChange = (index: number, value: string) => {
    const newArray = [...textareas];
    newArray[index] = value;
    setTextareas(newArray);
    onArrayChange(newArray);
  };

  const handleRemoveTextarea = (index: number) => {
    const newArray = textareas.filter((_, i) => i !== index);
    setTextareas(newArray);
    onArrayChange(newArray);
  };

  return (
    <div className="flex flex-col space-y-4">
      <h3>{label}</h3>
      {textareas.map((value, index) => (
        <ExpandableTextarea
          key={index}
          value={value}
          label={`${itemLabel} ${index + 1}`}
          onChange={(value) => handleTextareaChange(index, value)}
          onTrashClick={() => handleRemoveTextarea(index)}
        />
      ))}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleAddTextarea}
          className="px-2 py-2 bg-fadedGreen text-white rounded hover:bg-brightGreen mb-2"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};
