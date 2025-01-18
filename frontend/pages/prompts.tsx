import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import apiClient from '../lib/api';
import PromptList from '../components/PromptList';
import AddPromptForm from '../components/AddPromptForm';

export default function PersonasPage() {
  const [isAddingPrompt, setIsAddingPrompt] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [error, setError] = useState<string | null>(null);

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

  const handleOnSave = () => {
    fetchPrompts();
    setIsAddingPrompt(false);
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
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => setIsAddingPrompt(true)}
          >
            + Add New Prompt
          </button>
        </div>
        {isAddingPrompt && <AddPromptForm onSave={handleOnSave} onCancel={handleOnCancel} />}
        <PromptList prompts={prompts} error={error} onSave={handleOnSave} onCancel={handleOnCancel} />
      </div>
    </Layout>
  );
}
