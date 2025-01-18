import { useEffect, useState } from 'react';
import CharacterCardParser from '../components/CharacterCardParser';
import Layout from '../components/Layout';
import apiClient from '../lib/api';
import CharacterList from '../components/CharacterList';
import AddCharacterForm from '../components/AddCharacterForm';

export default function CharactersPage() {
  const [isAddingCharacter, setIsAddingCharacter] = useState(false);
  const [isManuallyAddingCharacter, setIsManuallyAddingCharacter] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState("");

  const handleOnSave = () => {
    setIsAddingCharacter(false);
  }

  const handleManualSave = () => {
    setIsManuallyAddingCharacter(false);
  }

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
  }, [isAddingCharacter]);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            Characters
          </h1>
          <div>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => setIsAddingCharacter(true)}
            >
              📷 Import from PNG
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ml-2"
              onClick={() => setIsManuallyAddingCharacter(true)}
            >
              + Add New Character
            </button>
          </div>
        </div>
        {isManuallyAddingCharacter && <AddCharacterForm onCancel={handleManualCancel} onSave={handleManualSave} />}
        {isAddingCharacter && <CharacterCardParser onSave={handleOnSave} />}
        <CharacterList error={error} characters={characters} fetchCharacters={fetchCharacters} />
      </div>
    </Layout>
  );
}
