import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PersonaList from '../components/PersonaList';
import apiClient from '../lib/api';
import AddPersonaForm from '../components/AddPersonaForm';

export default function PersonasPage() {
  const [isAddingPersona, setIsAddingPersona] = useState(false);
  const [personas, setPersonas] = useState([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonas = async () => {
    try {
      const response = await apiClient.get("/personas");
      if (!response.data) {
        throw new Error(`Failed to fetch personas: ${response.statusText}`);
      }
      const data = response.data;
      const sortedPersonas = data.sort((a, b) => a.name.localeCompare(b.name));
      setPersonas(sortedPersonas);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch character list.");
    }
  };

  const handleOnCancel = () => {
    setIsAddingPersona(false);
  }

  const handleOnSave = () => {
    fetchPersonas();
    setIsAddingPersona(false);
  }

  useEffect(() => {
    fetchPersonas();
  }, [isAddingPersona]);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Personas</h1>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => setIsAddingPersona(true)}
          >
            + Add New Persona
          </button>
        </div>
        {isAddingPersona && <AddPersonaForm onSave={handleOnSave} onCancel={handleOnCancel} />}
        <PersonaList personas={personas} error={error} onSave={handleOnSave} onCancel={handleOnCancel} />
      </div>
    </Layout>
  );
}
