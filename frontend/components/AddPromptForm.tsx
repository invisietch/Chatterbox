import { useState } from "react"
import ExpandableTextarea from "./ExpandableTextarea";
import { toast } from "react-toastify";

const AddPromptForm = ({ onSave, onCancel }: { onSave: (name: string, content: string) => void, onCancel: () => void }) => {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (name && content) {
      onSave(name, content);
    } else {
      toast.error("Please fill in all required fields.");
    }
  }

  return (
    <form className="mt-4 space-y-4 mb-4">
      <div className="pb-1 relative">
        <h3>Name</h3>
      </div>
      <div className="flex flex-col items-center p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded bg-dark text-gray-200 mb-2"
        />
      </div>
      <ExpandableTextarea label='Content' onChange={setContent} value={content} />

      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-fadedGreen text-white rounded hover:bg-brightGreen"
        >
          Save
        </button>
      </div>
    </form>
  );
}

export default AddPromptForm;