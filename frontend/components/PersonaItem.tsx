import { useEffect, useState } from "react";
import Accordion from "./Accordion";
import FormattedText from "./FormattedText";
import ExpandableTextarea from "./ExpandableTextarea";
import apiClient from "../lib/api";
import { toast } from "react-toastify";
import ReactDOM from "react-dom";
import { PencilIcon, TrashIcon } from "@heroicons/react/outline";

const PersonaItem = ({ persona, fetchPersonas }: { persona: any, fetchPersonas: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const handleCancel = () => setIsEditing(false);

  useEffect(() => {
    setName(persona.name);
    setContent(persona.content);
  }, [persona]);

  const handleSave = async () => {
    try {
      await apiClient.put(`/personas/${persona.id}`, { name, content });

      toast.success('Persona updated successfully.');
    } catch (error) {
      toast.error('Failed to save persona.');
    }

    fetchPersonas();
    setIsEditing(false);
  }

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/personas/${persona.id}`);

      toast.success('Persona deleted successfully.');
      setIsDeleting(false);
      fetchPersonas();
    } catch (error) {
      toast.error('Failed to delete persona.');
    }
  };

  return isEditing ? (
    <div>
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
      <ExpandableTextarea value={content} onChange={setContent} label='Content' />
      <div className="mt-2 flex justify-end space-x-2">
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
          Save Persona
        </button>
      </div>
    </div>
  ) : (
    <Accordion key={persona.id} title={name} id={persona.id} name={persona.name} type='persona'>
      <div className="pb-4 mb-4 relative">
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
            <p><strong>Content:</strong> <FormattedText t={content} /></p>
          </div>
        </div>
      </div>
      {isDeleting &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 flex items-center justify-center bg-dark2 bg-opacity-50">
            <div className="bg-dark1 p-6 rounded-lg max-w-sm w-full">
              <h3 className="text-lg font-bold text-white mb-4">
                Are you sure you want to delete this persona?
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
        )
      }
    </Accordion >
  );
}

export default PersonaItem;