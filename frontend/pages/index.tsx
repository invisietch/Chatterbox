import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import apiClient from '../lib/api';
import AddConversationForm from '../components/AddConversationForm';
import ConversationItem from '../components/ConversationItem';
import { useSelector } from 'react-redux';
import { RootState } from '../context/store';
import { toast } from 'react-toastify';
import FilterBox from '../components/FilterBox';
import { PlusIcon } from '@heroicons/react/outline';

const Conversations = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedConversationId, setExpandedConversationId] = useState(null);
  const [filters, setFilters] = useState({
    tags: [],
    characterIds: [],
    personaIds: [],
    promptIds: [],
  });

  const selectedModel = useSelector((state: RootState) => state.model.selectedModel);

  useEffect(() => {
    fetchConversations(filters);
  }, [filters]);

  const fetchConversations = async (filters: any) => {
    try {
      let url = '/conversations?';
      if (filters.tags.length > 0) {
        filters.tags.forEach((tag: any) => {
          url += `tags=${encodeURIComponent(tag.name)}&`;
        });
      }
      if (filters.characterIds.length > 0) {
        filters.characterIds.forEach((id: number) => {
          url += `character_ids=${encodeURIComponent(id)}&`;
        });
      }
      if (filters.personaIds.length > 0) {
        filters.personaIds.forEach((id: number) => {
          url += `persona_ids=${encodeURIComponent(id)}&`;
        });
      }
      if (filters.promptIds.length > 0) {
        filters.promptIds.forEach((id: number) => {
          url += `prompt_ids=${encodeURIComponent(id)}&`;
        });
      }

      // Make the API call
      const response = await apiClient.get(url);
      setConversations(response.data);
    } catch (_error) {
      toast.error('Error fetching conversations.');
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
        await apiClient.post(`/conversations/${conversationId}/tags/${tag.name}`);
      }

      toast.success('Conversation saved successfully.');
      // Reload conversations and close the form
      await fetchConversations(filters);
      setIsAdding(false);
    } catch (_error) {
      toast.error('Failed to save conversation.');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Conversations</h1>
          <div className="flex">
            <FilterBox onFilterChange={setFilters} />
            <button
              className="bg-fadedGreen text-white px-4 py-2 ml-2 rounded hover:bg-brightGreen"
              onClick={() => setIsAdding(true)}
            >
              <PlusIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Add Conversation Form */}
        {isAdding && (
          <AddConversationForm
            onSave={handleSaveConversation}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {/* Conversations List */}
        {conversations.length === 0 && <p className="text-gray-500">No conversations found.</p>}
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            fetchConversations={() => fetchConversations(filters)}
            modelIdentifier={selectedModel}
            expandedConversation={expandedConversationId === conversation.id}
            setExpandedConversation={(t: boolean) =>
              setExpandedConversationId(t ? conversation.id : null)
            }
          />
        ))}
      </div>
    </Layout>
  );
};

export default Conversations;
