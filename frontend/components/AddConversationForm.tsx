import { useState, useEffect } from 'react';
import TagPill from './TagPill';
import apiClient from '../lib/api';
import ExpandableTextarea from './ExpandableTextarea';
import { toast } from 'react-toastify';
import TagSelector from './TagSelector';

const AddConversationForm = ({
  onSave,
  onCancel,
}: {
  onSave: (conversation: any) => void;
  onCancel: () => void;
}) => {
  const [newConversation, setNewConversation] = useState({
    name: '',
    description: '',
    tags: [] as any[],
    characterId: null as number | null,
    personaId: null as number | null,
    promptId: null as number | null,
  });
  const [characters, setCharacters] = useState<{ id: number; name: string }[]>([]);
  const [personas, setPersonas] = useState([]);
  const [prompts, setPrompts] = useState([]);

  // Fetch characters for the dropdown and sort them alphabetically by name
  const fetchCharacters = async () => {
    try {
      const response = await apiClient.get('/characters');
      const sortedCharacters = response.data.sort((a: { name: string }, b: { name: string }) =>
        a.name.localeCompare(b.name)
      );
      setCharacters(sortedCharacters);
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  };

  const fetchPersonas = async () => {
    try {
      const response = await apiClient.get('/personas');
      const sortedPersonas = response.data.sort((a: { name: string }, b: { name: string }) =>
        a.name.localeCompare(b.name)
      );
      setPersonas(sortedPersonas);
    } catch (error) {
      console.error('Error fetching personas:', error);
    }
  };

  const fetchPrompts = async () => {
    try {
      const response = await apiClient.get('/prompts');
      const sortedPrompts = response.data.sort((a: { name: string }, b: { name: string }) =>
        a.name.localeCompare(b.name)
      );
      setPrompts(sortedPrompts);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  useEffect(() => {
    fetchCharacters();
    fetchPersonas();
    fetchPrompts();
  }, []);

  const handleSave = () => {
    if (newConversation.name.trim() && newConversation.description.trim()) {
      onSave(newConversation);
    } else {
      toast.error('Please fill out all fields.');
    }
  };

  return (
    <div className="p-4 mb-4 rounded">
      <h2 className="text-lg font-bold mb-2">Add New Conversation</h2>
      <div className="border-gray-600 pb-1 relative">
        <h3>Name</h3>
      </div>
      <div className="flex flex-col items-center p-4">
        <input
          value={newConversation.name}
          onChange={(e) => setNewConversation({ ...newConversation, name: e.target.value })}
          className="w-full p-2 border rounded bg-dark text-gray-200 mb-2"
        />
      </div>
      <ExpandableTextarea value={newConversation.description} onChange={(e) =>
        setNewConversation({
          ...newConversation,
          description: e,
        })} label='Description' />
      <TagSelector
        selectedTags={newConversation.tags}
        onTagChange={(tags: any[]) => setNewConversation({
          ...newConversation,
          tags,
        })}
        defaultColor='#3C3836'
      />
      <div className="mb-2">
        <div className="border-gray-600 pb-1 relative">
          <h3>Character (Optional)</h3>
        </div>
        <div className="flex flex-col items-center p-4">
          <select
            value={newConversation.characterId || ''}
            onChange={(e) =>
              setNewConversation({
                ...newConversation,
                characterId: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className="w-full p-2 border rounded bg-dark text-gray-200 overflow-y-auto"
          >
            <option value="">No character</option>
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-2">
        <div className="border-gray-600 pb-1 relative">
          <h3>Prompt (Optional)</h3>
        </div>
        <div className="flex flex-col items-center p-4">
          <select
            value={newConversation.promptId || ''}
            onChange={(e) =>
              setNewConversation({
                ...newConversation,
                promptId: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className="w-full p-2 border rounded bg-dark text-gray-200 overflow-y-auto"
          >
            <option value="">No prompt</option>
            {prompts.map((prompt) => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-2">
        <div className="border-gray-600 pb-1 relative">
          <h3>Persona (Optional)</h3>
        </div>
        <div className="flex flex-col items-center p-4">
          <select
            value={newConversation.personaId || ''}
            onChange={(e) =>
              setNewConversation({
                ...newConversation,
                personaId: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className="w-full p-2 border rounded bg-dark text-gray-200 overflow-y-auto"
          >
            <option value="">No persona</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <button
          className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-fadedGreen text-white rounded hover:bg-brightGeen"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default AddConversationForm;
