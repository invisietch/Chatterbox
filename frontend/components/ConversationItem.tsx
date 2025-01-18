import { useState, useEffect } from 'react';
import TagPill from '../components/TagPill';
import MessageList from './MessageList';
import apiClient from '../lib/api';
import FormattedText from './FormattedText';
import { toast } from 'react-toastify';
import ExpandableTextarea from './ExpandableTextarea';

const ConversationItem = ({ conversation, fetchConversations, modelIdentifier }: any) => {
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
  const [tags, setTags] = useState<string[]>([]);
  const [removedTags, setRemovedTags] = useState<string[]>([]);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [hoveredSuggestionIndex, setHoveredSuggestionIndex] = useState<number | null>(null);
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

  // Fetch tag suggestions
  const fetchTagSuggestions = async (query: string) => {
    if (query.length < 3) {
      setTagSuggestions([]);
      return;
    }

    try {
      const response = await apiClient.get('/tags', { params: { search: query } });
      setTagSuggestions(response.data.map((tag: any) => tag.name));
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
    }
  };

  // Handle tag input changes
  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);

    if (e.target.value.length >= 3) {
      fetchTagSuggestions(e.target.value);
    } else {
      setTagSuggestions([]);
    }
  };

  // Add a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && !newTags.includes(tagInput.trim())) {
      setNewTags([...newTags, tagInput.trim()]);
    }
    setTagInput('');
    setTagSuggestions([]);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
        handleAddTag();
      }
      setTagSuggestions([]);
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      handleRemoveTag(tagInput.trim());
      setTagInput('');
    }
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!tags.includes(tag) && !newTags.includes(tag)) {
      setNewTags([...newTags, tag]);
    }
    setTagInput('');
    setTagSuggestions([]);
    setHoveredSuggestionIndex(null);
  };

  const handleRemoveTag = (tag: string) => {
    if (tags.includes(tag)) {
      setRemovedTags([...removedTags, tag]);
      setTags(tags.filter((t) => t !== tag));
    } else if (newTags.includes(tag)) {
      setNewTags(newTags.filter((t) => t !== tag));
    }
  };

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
        await apiClient.post(`/conversations/${conversation.id}/tags/${tag}`);
      }

      for (const tag of removedTags) {
        await apiClient.delete(`/conversations/${conversation.id}/tags/${tag}`);
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

  return (
    <div className="pb-4 mb-4">
      {isEditing ? (
        <div>
          <div className="border-b border-gray-600 pb-4 relative">
            <h3>Name</h3>
          </div>
          <div className="flex flex-col items-center p-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded bg-gray-800 text-gray-200 mb-2"
            />
          </div>
          <ExpandableTextarea value={description} onChange={setDescription} label='Description' />

          <div className="mb-2">
            <div className="border-b border-gray-600 pb-4 relative">
              <h3>Tags</h3>
            </div>
            <div className="flex flex-col items-center p-4">
              <input
                type="text"
                placeholder="Type to search tags..."
                value={tagInput}
                onChange={handleTagInput}
                onKeyDown={handleTagKeyDown}
                className="w-full p-2 border rounded bg-gray-800 text-gray-200"
              />
            </div>
            {tagSuggestions.length > 0 && (
              <div className="bg-gray-700 border border-gray-600 rounded mt-2">
                {tagSuggestions.map((tag) => (
                  <div
                    key={tag}
                    className="p-2 hover:bg-gray-600 cursor-pointer"
                    onClick={() => handleAddSuggestedTag(tag)}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <TagPill key={tag} tag={tag} onRemove={handleRemoveTag} />
            ))}
            {newTags.map((tag) => (
              <TagPill key={tag} tag={tag} onRemove={handleRemoveTag} />
            ))}
          </div>
          <div className="mb-2">
            <div className="border-b border-gray-600 pb-4 relative">
              <h3>Character (Optional)</h3>
            </div>
            <div className="flex flex-col items-center p-4">
              <select
                value={characterId}
                onChange={(e) =>
                  setCharacterId(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full p-2 border rounded bg-gray-800 text-gray-200 overflow-y-auto"
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
            <div className="border-b border-gray-600 pb-4 relative">
              <h3>Prompt (Optional)</h3>
            </div>
            <div className="flex flex-col items-center p-4">
              <select
                value={promptId}
                onChange={(e) =>
                  setPromptId(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full p-2 border rounded bg-gray-800 text-gray-200 overflow-y-auto"
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
            <div className="border-b border-gray-600 pb-4 relative">
              <h3>Persona (Optional)</h3>
            </div>
            <div className="flex flex-col items-center p-4">
              <select
                value={personaId}
                onChange={(e) =>
                  setPersonaId(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full p-2 border rounded bg-gray-800 text-gray-200 overflow-y-auto"
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
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 ${unsavedChanges ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                } rounded`}
              disabled={!unsavedChanges}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="border-b border-gray-600 pb-4 mb-4 relative">
          <div className="flex justify-between items-center">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">{conversation.name}</h2>
                <div className="text-sm text-gray-400">
                  {tokenCount !== null ? `${tokenCount} tokens with chat template applied` : 'Loading tokens...'}
                </div>
                <p className="text-gray-300 mt-2"><FormattedText t={conversation.description} /></p>
                {character && <p className="text-gray-100 mt-2"><strong>Character: </strong><FormattedText t={character.name} /></p>}
                {prompt && <p className="text-gray-100"><strong>Prompt: </strong><FormattedText t={prompt.name} /></p>}
                {persona && <p className="text-gray-100"><strong>Persona: </strong><FormattedText t={persona.name} /></p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <TagPill key={tag} tag={tag} isLink />
                  ))}
                </div>
              </div>
              <div className="flex space-x-2 absolute top-2 right-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-500 hover:text-blue-600 mt-2"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setIsDeleting(true)}
                  className="text-red-400 hover:text-red-500"
                  aria-label="Delete message"
                >
                  🗑️
                </button>
              </div>
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
            />
          </div>
        </div>
      )}
      {
        isDeleting && (
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
          </div>
        )
      }
    </div>
  );
};

export default ConversationItem;
