import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PersonaList from '../components/PersonaList';
import apiClient from '../lib/api';
import AddPersonaForm from '../components/AddPersonaForm';
import { toast } from 'react-toastify';

export default function PersonasPage() {
  const [isAddingPersona, setIsAddingPersona] = useState(false);
  const [personas, setPersonas] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPersonas();
  }, []);

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

  const handleSavePersona = async (name: string, content: string) => {
    try {
      const response = await apiClient.post("/personas", { name, content });

      if (response.status === 200) {
        toast.success('Successfully saved persona.');

        await fetchPersonas();

        setIsAddingPersona(false);
      }
    } catch (error) {
      toast.error('Failed to save persona.');
    }
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Personas</h1>
          <button
            className="bg-fadedGreen text-white px-4 py-2 rounded hover:bg-brightGreen"
            onClick={() => setIsAddingPersona(true)}
          >
            + Add New Persona
          </button>
        </div>
        {isAddingPersona && <AddPersonaForm onSave={handleSavePersona} onCancel={handleOnCancel} />}
        <PersonaList personas={personas} error={error} fetchPersonas={fetchPersonas} />
      </div>
    </Layout>
  );
}
