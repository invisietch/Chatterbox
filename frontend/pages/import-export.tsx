import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import apiClient from '../lib/api';
import { DownloadIcon } from '@heroicons/react/outline';

export default function ImportExport() {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/conversations');
      const sortedConversations = response.data.sort((a: any, b: any) => b.id - a.id); // Newest first
      setConversations(sortedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAsJsonl = async (includeAllConversations: boolean) => {
    setLoading(true);
    try {
      // Extract conversation IDs
      const conversationIds = includeAllConversations
        ? conversations.map((conversation: any) => conversation.id)
        : []; // Modify to allow specific conversations if needed

      // Call the backend API with POST request to export JSONL
      const response = await apiClient.post('/conversations_jsonl', { conversation_ids: conversationIds }, {
        responseType: 'blob', // Get the response as a Blob to handle the file
      });

      // Create a link element to trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/jsonlines' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'conversations.jsonl'); // Set the default file name
      document.body.appendChild(link);
      link.click(); // Programmatically click the link to trigger the download
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting JSONL:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Import / Export</h1>
          <button
            className="bg-fadedYellow text-white px-4 py-2 rounded hover:bg-brightYellow"
            onClick={() => exportAsJsonl(true)}
            disabled={loading}
          >
            <DownloadIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
