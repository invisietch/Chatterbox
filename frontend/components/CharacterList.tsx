import React, { useState } from "react";
import Accordion from "./Accordion";
import FormattedText from "./FormattedText";
import CharacterItem from "./CharacterItem";

interface Character {
  id: number;
  name: string;
  scenario?: string;
  personality?: string;
  description: string;
  first_message: string;
  example_messages?: string;
  post_history_instructions?: string;
}

const CharacterList = ({ characters, error, fetchCharacters }: { characters: Character[], error: string, fetchCharacters: () => void }) => {
  return (
    <>
      {error && <p className="text-red-500">{error}</p>}
      {!error && characters.length === 0 && <p className="text-gray-500">No characters found.</p>}
      <div className="space-y-4">
        {characters.map((character) => (
          <CharacterItem character={character} onSave={fetchCharacters} />
        ))}
      </div>
    </>
  );
};

export default CharacterList;
