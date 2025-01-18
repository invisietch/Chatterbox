import React from "react";
import PersonaItem from "./PersonaItem";

interface Persona {
  id: number;
  name: string;
  content: string;
}

const PersonaList = ({ personas, error, onSave, onCancel }: { personas: Persona[], error: string, onSave: () => void, onCancel: () => void }) => {
  return (
    <>
      {error && <p className="text-red-500">{error}</p>}
      {!error && personas.length === 0 && <p className="text-gray-500">No personas found.</p>}
      <div className="space-y-4">
        {personas.map((persona) => (
          <PersonaItem persona={persona} onSave={onSave} />
        ))}
      </div>
    </>
  );
};

export default PersonaList;