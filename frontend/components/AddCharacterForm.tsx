import { useState } from "react"
import ExpandableTextarea from "./ExpandableTextarea";
import { toast } from "react-toastify";
import TagSelector from "./TagSelector";
import { ExpandableTextareaArray } from "./ExpandableTextareaArray";

const AddCharacterForm = ({ onSave, onCancel }: {
  onSave: (name: string,
    description: string,
    scenario: string | null,
    personality: string | null,
    firstMessage: string,
    exampleMessages: string | null,
    postHistoryInstructions: string | null,
    creator: string | null,
    creatorNotes: string | null,
    characterVersion: string | null,
    systemPrompt: string | null,
    alternateGreetings: string[],
    tags: any[],
  ) => void,
  onCancel: () => void
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scenario, setScenario] = useState("");
  const [personality, setPersonality] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [exampleMessages, setExampleMessages] = useState("");
  const [postHistoryInstructions, setPostHistoryInstructions] = useState("");
  const [creator, setCreator] = useState("");
  const [creatorNotes, setCreatorNotes] = useState("");
  const [characterVersion, setCharacterVersion] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [alternateGreetings, setAlternateGreetings] = useState([]);
  const [tags, setTags] = useState([]);

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
        creator || null,
        creatorNotes || null,
        characterVersion || null,
        systemPrompt || null,
        alternateGreetings,
        tags,
      );
    } else {
      toast.error('Please fill in all required fields.');
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
      <div className="pb-1 relative">
        <h3>Creator (optional)</h3>
      </div>
      <div className="flex flex-col items-center p-4">
        <input
          value={creator}
          onChange={(e) => setCreator(e.target.value)}
          className="w-full p-2 border rounded bg-dark text-gray-200 mb-2"
        />
      </div>
      <div className="pb-1 relative">
        <h3>Version (optional)</h3>
      </div>
      <div className="flex flex-col items-center p-4">
        <input
          value={characterVersion}
          onChange={(e) => setCharacterVersion(e.target.value)}
          className="w-full p-2 border rounded bg-dark text-gray-200 mb-2"
        />
      </div>
      <div className="pb-1 relative">
        <h3>Creator Notes (optional)</h3>
      </div>
      <div className="flex flex-col items-center p-4">
        <input
          value={creatorNotes}
          onChange={(e) => setCreatorNotes(e.target.value)}
          className="w-full p-2 border rounded bg-dark text-gray-200 mb-2"
        />
      </div>

      <ExpandableTextarea value={description} onChange={setDescription} label='Description' />
      <ExpandableTextarea value={scenario} onChange={setScenario} label='Scenario (optional)' />
      <ExpandableTextarea value={personality} onChange={setPersonality} label='Personality (optional)' />
      <ExpandableTextarea value={firstMessage} onChange={setFirstMessage} label='First Message' />
      <ExpandableTextarea value={exampleMessages} onChange={setExampleMessages} label='Example Messages (optional)' />
      <ExpandableTextarea value={systemPrompt} onChange={setSystemPrompt} label='System Prompt (optional)' />
      <ExpandableTextarea value={postHistoryInstructions} onChange={setPostHistoryInstructions} label='Post History Instructions (optional)' />
      <ExpandableTextareaArray
        label='Alternate Greetings (optional)'
        itemLabel="Greeting"
        onArrayChange={setAlternateGreetings}
        initialArray={alternateGreetings}
      />
      <TagSelector selectedTags={tags} onTagChange={setTags} defaultColor="#3c3c3c" />

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

export default AddCharacterForm;