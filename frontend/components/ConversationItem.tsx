import { useState, useEffect } from 'react';
import MessageList from './MessageList';
import apiClient from '../lib/api';
import FormattedText from './FormattedText';
import { toast } from 'react-toastify';
import ExpandableTextarea from './ExpandableTextarea';
import ReactDOM from 'react-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/outline';
import TagSelector from './TagSelector';
import { SortedTags } from './SortedTags';
import Avatar from './Avatar';

const ConversationItem = ({
  conversation,
  fetchConversations,
  modelIdentifier,
  expandedConversation,
  setExpandedConversation
}: {
  conversation: any,
  fetchConversations: () => void,
  modelIdentifier: string,
  expandedConversation: boolean,
  setExpandedConversation: (t: boolean) => void,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState(conversation.name);
  const [description, setDescription] = useState(conversation.description);
  const [character, setCharacter] = useState(null);
  const [characterId, setCharacterId] = useState(null);
  const [persona, setPersona] = useState(null);
  const [personaId, setPersonaId] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [promptId, setPromptId] = useState(null);
  const [tags, setTags] = useState<any[]>([]);
  const [removedTags, setRemovedTags] = useState<any[]>([]);
  const [newTags, setNewTags] = useState<any[]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [needsTokenRecount, setNeedsTokenRecount] = useState<boolean>(false);
  const [characters, setCharacters] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [prompts, setPrompts] = useState([]);

  // Fetch tags and conversation token count
  useEffect(() => {
    const fetchTagsAndTokens = async () => {
      try {
        const [tagsResponse, tokenResponse] = await Promise.all([
          apiClient.get(`/conversations/${conversation.id}/tags`),
          apiClient.get(`/conversations/${conversation.id}/token_count?model_identifier=${modelIdentifier}`),
        ]);
        setTags(tagsResponse.data);
        setTokenCount(tokenResponse.data.token_count);
        setNeedsTokenRecount(false);
      } catch (error) {
        console.error('Error fetching tags or token count:', error);
      }
    };

    fetchTagsAndTokens();
  }, [conversation.id, modelIdentifier, needsTokenRecount]);

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

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/conversations/${conversation.id}`);

      setIsDeleting(false);
      toast.success('Conversation deleted successfully.');
      fetchConversations();
    } catch (error) {
      toast.error('Failed to delete conversation.');
    }
  };

  useEffect(() => {
    fetchCharacters();
    fetchPersonas();
    fetchPrompts();
  }, [isEditing]);

  useEffect(() => {
    if (conversation.character_id) {
      const fetchCharacter = async () => {
        try {
          const response = await apiClient.get(`/characters/${conversation.character_id}`);
          setCharacter(response.data);
          setCharacterId(response.data.id);
        } catch (error) {
          console.error('Error fetching character:', error);
        }
      };

      fetchCharacter();
    }
  }, [conversation.character_id]);

  useEffect(() => {
    if (conversation.prompt_id) {
      const fetchPrompt = async () => {
        try {
          const response = await apiClient.get(`/prompts/${conversation.prompt_id}`);
          setPrompt(response.data);
          setPromptId(response.data.id);
        } catch (error) {
          console.error('Error fetching prompt:', error);
        }
      };

      fetchPrompt();
    }
  }, [conversation.prompt_id]);

  useEffect(() => {
    if (conversation.persona_id) {
      const fetchPersona = async () => {
        try {
          const response = await apiClient.get(`/personas/${conversation.persona_id}`);
          setPersona(response.data);
          setPersonaId(response.data.id);
        } catch (error) {
          console.error('Error fetching persona:', error);
        }
      };

      fetchPersona();
    }
  }, [conversation.persona_id]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges =
      name !== conversation.name ||
      description !== conversation.description ||
      !character && characterId ||
      character && characterId !== character.id ||
      !persona && personaId ||
      persona && personaId !== persona.id ||
      !prompt && promptId ||
      prompt && promptId !== prompt.id ||
      removedTags.length > 0 ||
      newTags.length > 0;
    setUnsavedChanges(hasChanges);
  }, [name, description, tags, removedTags, newTags, conversation, characterId, personaId, promptId]);

  // Save changes
  const handleSave = async () => {
    try {
      await apiClient.put(
        `/conversations/${conversation.id}`,
        { name, description, character_id: characterId, persona_id: personaId, prompt_id: promptId }
      );

      if (character && !characterId) {
        await apiClient.delete(`/conversations/${conversation.id}/character`);
      }

      if (character && !personaId) {
        await apiClient.delete(`/conversations/${conversation.id}/persona`);
      }

      if (character && !promptId) {
        await apiClient.delete(`/conversations/${conversation.id}/prompt`);
      }

      for (const tag of newTags) {
        await apiClient.post(`/conversations/${conversation.id}/tags/${tag.name}`);
      }

      for (const tag of removedTags) {
        await apiClient.delete(`/conversations/${conversation.id}/tags/${tag.name}`);
      }

      await fetchConversations();
      setIsEditing(false);
      setNewTags([]);
      setRemovedTags([]);
      toast.success('Conversation updated successfully.')
    } catch (error) {
      toast.error('Failed to update conversation.');
      console.error('Error saving conversation:', error);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setName(conversation.name);
    setDescription(conversation.description);
    setNewTags([]);
    setRemovedTags([]);
    apiClient.get(`/conversations/${conversation.id}/tags`).then((response) => {
      setTags(response.data);
    });
  };

  const handleTagChange = (handleTags: any[]) => {
    for (const tag of handleTags) {
      // Handle adding tags that haven't been added.
      if (!newTags.some(t => t.name === tag.name) && !tags.some(t => t.name === tag.name)) {
        setNewTags([...newTags, tag]);
      }

      // Remove re-added tags from removedTags.
      if (removedTags.some(t => t.name === tag.name)) {
        setRemovedTags(removedTags.filter(t => t.name !== tag.name));
      }
    }

    // Remove tags that aren't in the newly handled tags array.
    for (const tag of tags) {
      if (!handleTags.some(t => t.name === tag.name) && !removedTags.some(t => t.name === tag.name)) {
        setRemovedTags([...removedTags, tag]);
      }
    }

    // Remove newly deleted tags from newTags.
    for (const tag of newTags) {
      if (!handleTags.some(t => t.name === tag.name)) {
        setNewTags(newTags.filter(t => t.name !== tag.name));
      }
    }
  }

  return (
    <div className="pb-4 mb-4">
      {isEditing ? (
        <div>
          <div className="pb-1 relative">
            <h3>Name</h3>
          </div>
          <div className="flex flex-col items-center p-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded bg-dark text-gray-200 mb-2"
            />
          </div>
          <ExpandableTextarea value={description} onChange={setDescription} label='Description' />
          <div className="pb-1 relative">
            <h3>Tags</h3>
          </div>
          <TagSelector
            selectedTags={[...tags, ...newTags].filter(t => !removedTags.some(tag => t.name === tag.name))}
            onTagChange={handleTagChange}
            defaultColor='#3C3836'
          />
          <div className="mb-2">
            <div className="pb-1 relative">
              <h3>Character (Optional)</h3>
            </div>
            <div className="flex flex-col items-center p-4">
              <select
                value={characterId}
                onChange={(e) =>
                  setCharacterId(e.target.value ? parseInt(e.target.value) : null)
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
            <div className="pb-1 relative">
              <h3>Prompt (Optional)</h3>
            </div>
            <div className="flex flex-col items-center p-4">
              <select
                value={promptId}
                onChange={(e) =>
                  setPromptId(e.target.value ? parseInt(e.target.value) : null)
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
            <div className="pb-1 relative">
              <h3>Persona (Optional)</h3>
            </div>
            <div className="flex flex-col items-center p-4">
              <select
                value={personaId}
                onChange={(e) =>
                  setPersonaId(e.target.value ? parseInt(e.target.value) : null)
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
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 ${unsavedChanges ? 'bg-fadedGreen hover:bg-brightGreen text-white' : 'bg-dark border border-fadedGreen text-gray-300 cursor-not-allowed'
                } rounded`}
              disabled={!unsavedChanges}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="pb-4 mb-4 relative">
          <div className="flex items-center">
            {character && (
              <Avatar
                id={character.id}
                name={character.name}
                type="character"
                size={120}
              />
            )}
            <div className="ml-4">
              <h2 className="text-lg font-bold">{conversation.name}</h2>
              <div className="text-sm text-gray-400">
                {tokenCount !== null ? `${tokenCount} tokens with chat template applied` : 'Loading tokens...'}
              </div>
              <p className="text-gray-300 mt-2"><FormattedText t={conversation.description} /></p>
              {character && <p className="text-gray-100 mt-2"><strong>Character: </strong><FormattedText t={character.name} /></p>}
              {prompt && <p className="text-gray-100"><strong>Prompt: </strong><FormattedText t={prompt.name} /></p>}
              {persona && <p className="text-gray-100"><strong>Persona: </strong><FormattedText t={persona.name} /></p>}
              <SortedTags tags={tags} />
            </div>
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
          </div>

          <div className="mt-4">
            <MessageList
              conversationId={conversation.id}
              modelIdentifier={modelIdentifier}
              onMessagesChange={setNeedsTokenRecount}
              character={character}
              persona={persona}
              prompt={prompt}
              expanded={expandedConversation}
              setExpanded={setExpandedConversation}
            />
          </div>
        </div>
      )}
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
    </div>
  );
};

export default ConversationItem;
