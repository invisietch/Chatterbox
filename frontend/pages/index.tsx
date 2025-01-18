import { useContext, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import apiClient from '../lib/api';
import AddConversationForm from '../components/AddConversationForm';
import ConversationItem from '../components/ConversationItem';
import { useSelector } from 'react-redux';
import { RootState } from '../context/store';
import { toast } from 'react-toastify';

const Conversations = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false); // Control visibility of the form
  const [loading, setLoading] = useState(true);

  const selectedModel = useSelector((state: RootState) => state.model.selectedModel);

  useEffect(() => {
    fetchConversations();
  }, []);

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

  const handleSaveConversation = async (newConversation: any) => {
    try {
      const response = await apiClient.post('/conversations', {
        name: newConversation.name,
        description: newConversation.description,
        character_id: newConversation.characterId || null,
        persona_id: newConversation.personaId || null,
        prompt_id: newConversation.promptId || null,
      });

      const conversationId = response.data.id;

      // Add tags to the new conversation
      for (const tag of newConversation.tags) {
        await apiClient.post(`/conversations/${conversationId}/tags/${tag}`);
      }

      toast.success('Conversation saved successfully.');
      // Reload conversations and close the form
      await fetchConversations();
      setIsAdding(false);
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast.error('Failed to save conversation.');
    }
  };

  if (loading) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Conversations</h1>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => setIsAdding(true)}
          >
            + Add New Conversation
          </button>
        </div>

        {/* Add Conversation Form */}
        {isAdding && (
          <AddConversationForm
            onSave={handleSaveConversation}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {/* Conversations List */}
        {conversations.map((conversation) => (
          <ConversationItem key={conversation.id} conversation={conversation} fetchConversations={fetchConversations} modelIdentifier={selectedModel} />
        ))}
      </div>
    </Layout>
  );
};

export default Conversations;
