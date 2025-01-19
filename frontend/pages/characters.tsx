import { useEffect, useState } from 'react';
import CharacterCardParser from '../components/CharacterCardParser';
import Layout from '../components/Layout';
import apiClient from '../lib/api';
import CharacterList from '../components/CharacterList';
import AddCharacterForm from '../components/AddCharacterForm';
import { toast } from 'react-toastify';

export default function CharactersPage() {
  const [isAddingCharacter, setIsAddingCharacter] = useState(false);
  const [isManuallyAddingCharacter, setIsManuallyAddingCharacter] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState("");

  const handleOnSave = () => {
    setIsAddingCharacter(false);
  }

  const handleManualSaveCharacter = async (
    name: string,
    description: string,
    scenario: string | null,
    personality: string | null,
    firstMessage: string,
    exampleMessages: string | null,
    postHistoryInstructions: string | null
  ) => {
    try {
      const response = await apiClient.post("/characters", {
        name,
        description,
        scenario,
        personality,
        first_message: firstMessage,
        example_messages: exampleMessages,
        post_history_instructions: postHistoryInstructions,
      });

      if (response.status === 200) {
        toast.success('Successfully saved character.');

        await fetchCharacters();

        setIsManuallyAddingCharacter(false);
      } else {
        toast.error('Failed to save character.');
      }
    } catch (error) {
      toast.error('Failed to save character.');
    }
  };

  const handleManualCancel = () => {
    setIsManuallyAddingCharacter(false);
  }

  const fetchCharacters = async () => {
    try {
      const response = await apiClient.get("/characters");
      if (!response.data) {
        throw new Error(`Failed to fetch characters: ${response.statusText}`);
      }
      const data = response.data;
      const sortedCharacters = data.sort((a, b) => a.name.localeCompare(b.name));
      setCharacters(sortedCharacters);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch character list.");
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [isAddingCharacter, isManuallyAddingCharacter]);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            Characters
          </h1>
          <div>
            <button
              className="bg-fadedYellow text-white px-4 py-2 rounded hover:bg-brightYellow"
              onClick={() => setIsAddingCharacter(true)}
            >
              📷 Import from PNG
            </button>
            <button
              className="bg-fadedGreen text-white px-4 py-2 rounded hover:bg-brightGreen ml-2"
              onClick={() => setIsManuallyAddingCharacter(true)}
            >
              + Add New Character
            </button>
          </div>
        </div>
        {isManuallyAddingCharacter && <AddCharacterForm onCancel={handleManualCancel} onSave={handleManualSaveCharacter} />}
        {isAddingCharacter && <CharacterCardParser onSave={handleOnSave} />}
        <CharacterList error={error} characters={characters} fetchCharacters={fetchCharacters} />
      </div>
    </Layout>
  );
}
