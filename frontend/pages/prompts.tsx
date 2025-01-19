import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import apiClient from '../lib/api';
import PromptList from '../components/PromptList';
import AddPromptForm from '../components/AddPromptForm';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/outline';

export default function PromptsPage() {
  const [isAddingPrompt, setIsAddingPrompt] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await apiClient.get("/prompts");
      if (!response.data) {
        throw new Error(`Failed to fetch prompts: ${response.statusText}`);
      }
      const data = response.data;
      const sortedPrompts = data.sort((a, b) => a.name.localeCompare(b.name));
      setPrompts(sortedPrompts);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch character list.");
    }
  };

  const handleSavePrompt = async (name: string, content: string) => {
    try {
      const response = await apiClient.post("/prompts", { name, content });

      if (response.status === 200) {
        toast.success('Successfully saved prompt.');

        await fetchPrompts();

        setIsAddingPrompt(false);
      }
    } catch (error) {
      toast.error('Failed to save prompt.');
    }
  }

  const handleOnCancel = () => {
    setIsAddingPrompt(false);
  }

  useEffect(() => {
    fetchPrompts();
  }, [isAddingPrompt]);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Prompts</h1>
          <button
            className="bg-fadedGreen text-white px-4 py-2 rounded hover:bg-brightGreen"
            onClick={() => setIsAddingPrompt(true)}
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>
        {isAddingPrompt && <AddPromptForm onSave={handleSavePrompt} onCancel={handleOnCancel} />}
        <PromptList prompts={prompts} error={error} fetchPrompts={fetchPrompts} />
      </div>
    </Layout>
  );
}
