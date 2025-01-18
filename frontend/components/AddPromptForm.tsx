import { useState } from "react"
import apiClient from "../lib/api";
import ExpandableTextarea from "./ExpandableTextarea";
import { toast } from "react-toastify";

const AddPromptForm = ({ onSave, onCancel }: { onSave: () => void, onCancel: () => void }) => {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    try {
      await apiClient.post("/prompts", { name, content });

      toast.success('Prompt saved successfully.');
      onSave();
    } catch (error) {
      toast.error('Failed to save prompt.')
      console.error('Error saving prompt:', error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 mb-4">
      <div className="border-b border-gray-600 pb-4 relative">
        <h3>Name</h3>
      </div>
      <div className="flex flex-col items-center p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded bg-gray-800 text-gray-200 mb-2"
        />
      </div>
      <ExpandableTextarea label='Content' onChange={setContent} value={content} />

      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </form>
  );
}

export default AddPromptForm;