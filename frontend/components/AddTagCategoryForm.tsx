import { useState } from "react";
import { ColorSwatchIcon } from "@heroicons/react/outline";
import TagSelector from "./TagSelector";
import { toast } from "react-toastify";

const suggestedColors = [
  "#b57614", "#076678", "#8f3f71", "#427b58", "#af3a03", "#cc241d",
  "#98971a", "#d79921", "#458588", "#b16286", "#689d6a", "#d65d0e",
];

const AddTagCategoryForm = ({ onSave, onCancel }: any) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState(suggestedColors[0]);
  const [tags, setTags] = useState([]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    await onSave(name, color, tags);
  };

  const triggerColorPicker = () => {
    const colorPicker = document.getElementById("color-picker");
    if (colorPicker) {
      colorPicker.click(); // Programmatically open the color picker
    }
  };

  return (
    <>
      <div className="pb-1 relative">
        <h3>Name</h3>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded bg-dark text-gray-200 mb-2"
      />

      <div className="pb-1 relative">
        <h3>Color</h3>
      </div>

      {/* Suggested Colors */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {suggestedColors.map((suggestedColor) => (
          <button
            key={suggestedColor}
            type="button"
            className={`w-8 h-8 rounded-full border-2 ${color === suggestedColor ? "border-white" : "border-transparent"
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
            className={`w-8 h-8 rounded-full border-2 ${!suggestedColors.some(col => col === color) ? "border-white" : "border-transparent"} flex justify-center items-center bg-gray-700 hover:bg-gray-600`}
            style={{ backgroundColor: !suggestedColors.some(col => col === color) ? color : "#ffffff" }}
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

      <TagSelector selectedTags={tags} onTagChange={setTags} defaultColor="#3c3c3c" />

      <div className="flex justify-end gap-2 mt-2 mb-2">
        <button
          onClick={onCancel}
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
    </>
  );
};

export default AddTagCategoryForm;
