import { useState, useEffect } from 'react';
import apiClient from '../lib/api';
import { toast } from 'react-toastify';
import ExpandableTextarea from './ExpandableTextarea';
import { highlightPlaceholders, highlightText } from '../lib/textUtils';
import Avatar from './Avatar'; // Import the Avatar component
import { highlightSlop } from '../lib/slop';

const MessageItem = ({
  message,
  modelIdentifier,
  fetchMessages,
  warning,
  character,
  persona,
}: {
  message: any;
  modelIdentifier: string;
  fetchMessages: () => void;
  warning: boolean;
  character: any | null;
  persona: any | null;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(message.content);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageText, setMessageText] = useState(message.highlightedText);
  const [slopCount, setSlopCount] = useState(0);

  // Fetch token count when the component loads
  useEffect(() => {
    const fetchTokenCount = async () => {
      try {
        const response = await apiClient.get(`/messages/${message.id}/token_count`, {
          params: { model_identifier: modelIdentifier },
        });
        setTokenCount(response.data.token_count);
      } catch (error) {
        console.error('Error fetching token count for message:', error);
      }
    };

    fetchTokenCount();
  }, [message.id, modelIdentifier]);

  useEffect(() => {
    const { highlightedText, count } = highlightSlop(
      highlightPlaceholders(
        highlightText(
          message.content
        ),
        character?.name || '',
        persona?.name || ''
      )
    );

    setMessageText(highlightedText);
    setSlopCount(count);
  }, [character?.name, persona?.name, message.content]);

  const handleEdit = () => {
    setIsEditing(true); // Enable editing mode
  };

  const handleCancel = () => {
    setIsEditing(false); // Disable editing mode
    setContent(message.content); // Revert to original content
  };

  const handleSave = async () => {
    try {
      // Save the updated message
      await apiClient.put(`/messages/${message.id}`, { content });

      // After saving, fetch the updated token count
      const response = await apiClient.get(`/messages/${message.id}/token_count`, {
        params: { model_identifier: modelIdentifier },
      });

      setTokenCount(response.data.token_count);
      setIsEditing(false); // Disable editing mode after save

      toast.success('Message updated successfully.');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to update message.');
      console.error('Error saving message:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      // Delete the message
      await apiClient.delete(`/messages/${message.id}`);

      toast.success('Message deleted successfully.');
      fetchMessages(); // Call the parent component's fetchMessages function to refresh the list
    } catch (error) {
      toast.error('Failed to delete message.');
      console.error('Error deleting message:', error);
    }
  };

  // Determine which avatar to display
  const avatarData = message.author === 'user' ? persona : message.author === 'assistant' ? character : null;

  return (
    <div className="border-b border-gray-600 pb-4 mb-4 relative flex">
      {/* Avatar Section */}
      <div className="flex-shrink-0 mr-4">
        {avatarData && (
          <Avatar
            id={avatarData.id}
            name={avatarData.name}
            type={message.author === 'user' ? 'persona' : 'character'}
            size={120}
          />
        )}
        {!avatarData && (
          <Avatar seed='system' size={120} />
        )}
        <div className="mt-2 text-center text-gray-400 text-sm">
          {message.author == 'user' && <div className="font-bold text-personaHighlight">{persona.name}</div>}
          {message.author == 'assistant' && <div className="font-bold text-characterHighlight">{character.name}</div>}
          <div>
            {warning && '⚠️ '}
            {slopCount > 0 && '🤢 '}
          </div>
          <div className="font-bold">{message.author}</div>
          <div>[{tokenCount ?? '...'} tokens]</div>
        </div>
      </div>

      {/* Message Content Section */}
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          {/* Edit and Delete Buttons in Top Right */}
          <div className="flex space-x-2 absolute top-2 right-2">
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="text-blue-400 hover:text-blue-500"
                aria-label="Edit message"
              >
                ✏️
              </button>
            )}

            <button
              onClick={() => setIsDeleting(true)}
              className="text-red-400 hover:text-red-500"
              aria-label="Delete message"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Message content */}
        {isEditing ? (
          <div>
            <ExpandableTextarea label="Content" onChange={setContent} value={content} />
            <div className="mt-2 flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save Message
              </button>
            </div>
          </div>
        ) : (
          <div
            className="text-gray-300 mt-2 w-11/12"
            dangerouslySetInnerHTML={{ __html: messageText }}
          />
        )}
      </div>

      {/* Modal for Delete Confirmation */}
      {isDeleting && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-4">
              Are you sure you want to delete this message?
            </h3>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleting(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageItem;
