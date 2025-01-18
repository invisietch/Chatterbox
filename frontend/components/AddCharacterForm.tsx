import { useState } from "react"
import apiClient from "../lib/api";
import ExpandableTextarea from "./ExpandableTextarea";
import { toast } from "react-toastify";

const AddCharacterForm = ({ onSave, onCancel }: {
  onSave: (name: string,
    description: string,
    scenario: string | null,
    personality: string | null,
    firstMessage: string,
    exampleMessages: string | null,
    postHistoryInstructions: string | null) => void,
  onCancel: () => void
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scenario, setScenario] = useState("");
  const [personality, setPersonality] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [exampleMessages, setExampleMessages] = useState("");
  const [postHistoryInstructions, setPostHistoryInstructions] = useState("");

  const handleSubmit = () => {
    if (name && description && firstMessage) {
      onSave(
        name,
        description,
        scenario || null,
        personality || null,
        firstMessage,
        exampleMessages || null,
        postHistoryInstructions || null,
      );
    } else {
      toast.error('Please fill in all required fields.');
    }
  }

  return (
    <form className="mt-4 space-y-4 mb-4">
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
      <ExpandableTextarea value={description} onChange={setDescription} label='Description' />
      <ExpandableTextarea value={scenario} onChange={setScenario} label='Scenario (optional)' />
      <ExpandableTextarea value={personality} onChange={setPersonality} label='Personality (optional)' />
      <ExpandableTextarea value={firstMessage} onChange={setFirstMessage} label='First Message' />
      <ExpandableTextarea value={exampleMessages} onChange={setExampleMessages} label='Example Messages (optional)' />
      <ExpandableTextarea value={postHistoryInstructions} onChange={setPostHistoryInstructions} label='Post History Instructions (optional)' />

      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </form>
  );
}

export default AddCharacterForm;