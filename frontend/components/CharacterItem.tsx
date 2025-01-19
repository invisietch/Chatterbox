import { useEffect, useState } from "react";
import Accordion from "./Accordion";
import FormattedText from "./FormattedText";
import ExpandableTextarea from "./ExpandableTextarea";
import apiClient from "../lib/api";
import { toast } from "react-toastify";
import ReactDOM from "react-dom";
import { PencilIcon, TrashIcon } from "@heroicons/react/outline";

const CharacterItem = ({ character, onSave }: { character: any, onSave: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scenario, setScenario] = useState("");
  const [personality, setPersonality] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [exampleMessages, setExampleMessages] = useState("");
  const [postHistoryInstructions, setPostHistoryInstructions] = useState("");

  const handleCancel = () => setIsEditing(false);

  useEffect(() => {
    setName(character.name);
    setDescription(character.description);
    setScenario(character.scenario);
    setPersonality(character.personality);
    setFirstMessage(character.first_message);
    setExampleMessages(character.example_messages);
    setPostHistoryInstructions(character.post_history_instructions);
  }, [character]);

  const handleSave = async () => {
    try {
      await apiClient.put(
        `/characters/${character.id}`,
        {
          name,
          description,
          scenario,
          personality,
          first_message: firstMessage,
          example_messages: exampleMessages,
          post_history_instructions: postHistoryInstructions,
        }
      );

      toast.success('Character updated successfully.');
    } catch (error) {
      toast.error('Failed to update character.');
      console.error('Error saving character:', error);
      alert('Failed to save character.');
    }

    onSave();
    setIsEditing(false);
  }

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/characters/${character.id}`);

      toast.success('Character deleted successfully.');
      setIsDeleting(false);
      onSave();
    } catch (error) {
      toast.error('Failed to delete character.');
    }
  };

  return isEditing ? (
    <div>
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
      <ExpandableTextarea value={scenario} onChange={setScenario} label='Scenario' />
      <ExpandableTextarea value={personality} onChange={setPersonality} label='Personality' />
      <ExpandableTextarea value={firstMessage} onChange={setFirstMessage} label='First Message' />
      <ExpandableTextarea value={exampleMessages} onChange={setExampleMessages} label='Example Messages' />
      <ExpandableTextarea value={postHistoryInstructions} onChange={setPostHistoryInstructions} label='Post History Instructions' />
      <div className="mt-2 flex justify-end space-x-2">
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save Character
        </button>
      </div>
    </div>
  ) : (
    <Accordion key={character.id} title={name} id={character.id} name={character.name} type='character'>
      <div className="border-b border-gray-600 pb-4 mb-4 relative">
        <div className="flex justify-between items-center">
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
          <div className="text-sm text-gray-300 w-11/12">
            <p><strong>Description:</strong> <FormattedText t={description} /></p>
            {scenario && <p><strong>Scenario:</strong> <FormattedText t={scenario} /></p>}
            {personality && <p><strong>Personality:</strong> <FormattedText t={personality} /></p>}
            <p><strong>First Message:</strong> <FormattedText t={firstMessage} /></p>
            {exampleMessages && <p><strong>Example Messages:</strong> <FormattedText t={exampleMessages} /></p>}
            {postHistoryInstructions && (
              <p><strong>Post History Instructions:</strong> <FormattedText t={postHistoryInstructions} /></p>
            )}
          </div>
        </div>
      </div>
      {isDeleting &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full">
              <h3 className="text-lg font-bold text-white mb-4">
                Are you sure you want to delete this character?
              </h3>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsDeleting(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </Accordion >

  );
}

export default CharacterItem;