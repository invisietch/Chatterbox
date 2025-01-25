import { useEffect, useState } from 'react';
import Accordion from './Accordion';
import FormattedText from './FormattedText';
import ExpandableTextarea from './ExpandableTextarea';
import apiClient from '../lib/api';
import { toast } from 'react-toastify';
import ReactDOM from 'react-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/outline';
import { SortedTags } from './SortedTags';
import { ExpandableTextareaArray } from './ExpandableTextareaArray';
import TagSelector from './TagSelector';

const CharacterItem = ({
  character,
  onSave,
  fetchCharacters,
}: {
  character: any;
  onSave: () => void;
  fetchCharacters: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState('');
  const [creator, setCreator] = useState('');
  const [creatorNotes, setCreatorNotes] = useState('');
  const [characterVersion, setCharacterVersion] = useState('');
  const [description, setDescription] = useState('');
  const [scenario, setScenario] = useState('');
  const [personality, setPersonality] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [exampleMessages, setExampleMessages] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tags, setTags] = useState([]);
  const [postHistoryInstructions, setPostHistoryInstructions] = useState('');
  const [alternateGreetings, setAlternateGreetings] = useState([]);
  const [newTags, setNewTags] = useState([]);
  const [removedTags, setRemovedTags] = useState([]);

  const handleCancel = () => {
    fetchCharacters();
    setIsEditing(false);
  };

  useEffect(() => {
    setName(character.name);
    setCreator(character.creator);
    setCreatorNotes(character.creator_notes);
    setCharacterVersion(character.character_version);
    setDescription(character.description);
    setScenario(character.scenario);
    setPersonality(character.personality);
    setFirstMessage(character.first_message);
    setExampleMessages(character.example_messages);
    setSystemPrompt(character.system_prompt);
    setPostHistoryInstructions(character.post_history_instructions);
    setAlternateGreetings(character.alternate_greetings || []);
  }, [character]);

  useEffect(() => {
    if (character.id) {
      fetchTags();
    }
  }, [character]);

  const fetchTags = async () => {
    try {
      const response = await apiClient.get(`/characters/${character.id}/tags`);

      if (response.status === 200) {
        setTags(response.data);
      } else {
        throw new Error('Failed.');
      }
    } catch (_error) {
      toast.error('Failed to fetch character tags.');
    }
  };

  const handleSave = async () => {
    try {
      await apiClient.put(`/characters/${character.id}`, {
        name,
        creator: creator || null,
        creator_notes: creatorNotes || null,
        character_version: characterVersion || null,
        description,
        scenario,
        personality,
        first_message: firstMessage,
        example_messages: exampleMessages,
        system_prompt: systemPrompt,
        post_history_instructions: postHistoryInstructions,
        alternate_greetings: alternateGreetings || null,
      });

      for (const tag of newTags) {
        await apiClient.post(`/characters/${character.id}/tags/${tag.name}`);
      }

      for (const tag of removedTags) {
        await apiClient.delete(`/characters/${character.id}/tags/${tag.name}`);
      }

      toast.success('Character updated successfully.');
    } catch (_error) {
      toast.error('Failed to update character.');
    }

    onSave();
    setIsEditing(false);
  };

  const handleTagChange = (handleTags: any[]) => {
    for (const tag of handleTags) {
      // Handle adding tags that haven't been added.
      if (!newTags.some((t) => t.name === tag.name) && !tags.some((t) => t.name === tag.name)) {
        setNewTags([...newTags, tag]);
      }

      // Remove re-added tags from removedTags.
      if (removedTags.some((t) => t.name === tag.name)) {
        setRemovedTags(removedTags.filter((t) => t.name !== tag.name));
      }
    }

    // Remove tags that aren't in the newly handled tags array.
    for (const tag of tags) {
      if (
        !handleTags.some((t) => t.name === tag.name) &&
        !removedTags.some((t) => t.name === tag.name)
      ) {
        setRemovedTags([...removedTags, tag]);
      }
    }

    // Remove newly deleted tags from newTags.
    for (const tag of newTags) {
      if (!handleTags.some((t) => t.name === tag.name)) {
        setNewTags(newTags.filter((t) => t.name !== tag.name));
      }
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/characters/${character.id}`);

      toast.success('Character deleted successfully.');
      setIsDeleting(false);
      onSave();
    } catch (_error) {
      toast.error('Failed to delete character.');
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
      <div className="pb-1 relative">
        <h3>Creator</h3>
      </div>
      <div className="flex flex-col items-center p-4">
        <input
          value={creator}
          onChange={(e) => setCreator(e.target.value)}
          className="w-full p-2 border rounded bg-dark text-gray-200 mb-2"
        />
      </div>
      <div className="pb-1 relative">
        <h3>Creator Notes</h3>
      </div>
      <div className="flex flex-col items-center p-4">
        <input
          value={creatorNotes}
          onChange={(e) => setCreatorNotes(e.target.value)}
          className="w-full p-2 border rounded bg-dark text-gray-200 mb-2"
        />
      </div>
      <div className="pb-1 relative">
        <h3>Version</h3>
      </div>
      <div className="flex flex-col items-center p-4">
        <input
          value={characterVersion}
          onChange={(e) => setCharacterVersion(e.target.value)}
          className="w-full p-2 border rounded bg-dark text-gray-200 mb-2"
        />
      </div>
      <ExpandableTextarea value={description} onChange={setDescription} label="Description" />
      <ExpandableTextarea value={scenario} onChange={setScenario} label="Scenario" />
      <ExpandableTextarea value={personality} onChange={setPersonality} label="Personality" />
      <ExpandableTextarea value={firstMessage} onChange={setFirstMessage} label="First Message" />
      <ExpandableTextarea
        value={exampleMessages}
        onChange={setExampleMessages}
        label="Example Messages"
      />
      <ExpandableTextarea value={systemPrompt} onChange={setSystemPrompt} label="System Prompt" />
      <ExpandableTextarea
        value={postHistoryInstructions}
        onChange={setPostHistoryInstructions}
        label="Post History Instructions"
      />
      <ExpandableTextareaArray
        label="Alternate Greetings"
        itemLabel="Alternate Greeting"
        onArrayChange={setAlternateGreetings}
        initialArray={alternateGreetings}
      />
      <TagSelector
        selectedTags={[...tags, ...newTags].filter(
          (t) => !removedTags.some((tag) => t.name === tag.name)
        )}
        onTagChange={handleTagChange}
        defaultColor="#3C3836"
      />
      <div className="mt-2 flex justify-end space-x-2">
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-fadedGreen text-white rounded hover:bg-fadedGreen"
        >
          Save Character
        </button>
      </div>
    </div>
  ) : (
    <Accordion
      key={character.id}
      title={name}
      id={character.id}
      name={character.name}
      type="character"
    >
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
            <p>
              <strong>Description:</strong> <FormattedText t={description} />
            </p>
            {creator && (
              <p>
                <strong>Creator:</strong> <FormattedText t={creator} />
              </p>
            )}
            {creatorNotes && (
              <p>
                <strong>Creator Notes:</strong> <FormattedText t={creatorNotes} />
              </p>
            )}
            {characterVersion && (
              <p>
                <strong>Character Version:</strong> <FormattedText t={characterVersion} />
              </p>
            )}
            {scenario && (
              <p>
                <strong>Scenario:</strong> <FormattedText t={scenario} />
              </p>
            )}
            {personality && (
              <p>
                <strong>Personality:</strong> <FormattedText t={personality} />
              </p>
            )}
            <p>
              <strong>First Message:</strong> <FormattedText t={firstMessage} />
            </p>
            {exampleMessages && (
              <p>
                <strong>Example Messages:</strong> <FormattedText t={exampleMessages} />
              </p>
            )}
            {postHistoryInstructions && (
              <p>
                <strong>Post History Instructions:</strong>{' '}
                <FormattedText t={postHistoryInstructions} />
              </p>
            )}
            {systemPrompt && (
              <p>
                <strong>System Prompt:</strong> <FormattedText t={systemPrompt} />
              </p>
            )}
            {alternateGreetings && (
              <>
                {alternateGreetings.map((greeting: string, idx: number) => (
                  <p>
                    <strong>Alternate Greeting {idx + 1}:</strong> <FormattedText t={greeting} />
                  </p>
                ))}
              </>
            )}
            {tags && <SortedTags tags={tags} />}
          </div>
        </div>
      </div>
      {isDeleting &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 flex items-center justify-center bg-dark1 bg-opacity-50">
            <div className="bg-dark p-6 rounded-lg max-w-sm w-full">
              <h3 className="text-lg font-bold text-white mb-4">
                Are you sure you want to delete this character?
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
        )}
    </Accordion>
  );
};

export default CharacterItem;
