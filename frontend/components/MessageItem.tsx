import { useState, useEffect } from 'react';
import apiClient from '../lib/api';
import { toast } from 'react-toastify';
import ExpandableTextarea from './ExpandableTextarea';
import { highlightPlaceholders, highlightText } from '../lib/textUtils';
import Avatar from './Avatar';
import { highlightSlop } from '../lib/slop';

const MessageItem = ({
  message,
  modelIdentifier,
  fetchMessages,
  warning,
  character,
  persona,
  isEditing,
  setIsEditing,
}: {
  message: any;
  modelIdentifier: string;
  fetchMessages: () => void;
  warning: boolean;
  character: any | null;
  persona: any | null;
  isEditing: boolean;
  setIsEditing: (t: boolean) => void;
}) => {
  const [content, setContent] = useState(message.content);
  const [rejected, setRejected] = useState(message.rejected);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [rejectedTokenCount, setRejectedTokenCount] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [messageText, setMessageText] = useState(message.content);
  const [messageRejected, setMessageRejected] = useState(message.rejected);
  const [slopCount, setSlopCount] = useState(0);
  const [rejectedSlopCount, setRejectedSlopCount] = useState(0);

  useEffect(() => {
    const fetchTokenCount = async () => {
      try {
        const response = await apiClient.get(`/messages/${message.id}/token_count`, {
          params: { model_identifier: modelIdentifier },
        });
        setTokenCount(response.data.token_count);
        setRejectedTokenCount(response.data.rejected_token_count);
      } catch (error) {
        console.error('Error fetching token count for message:', error);
      }
    };

    fetchTokenCount();
  }, [message.id, modelIdentifier]);

  useEffect(() => {
    const { highlightedText, count } = highlightSlop(
      highlightPlaceholders(
        highlightText(message.content),
        character?.name || '',
        persona?.name || ''
      )
    );

    setMessageText(highlightedText);
    setSlopCount(count);

    if (message.rejected) {
      const { highlightedText: highlightedRejected, count: rejectedCount } = highlightSlop(
        highlightPlaceholders(
          highlightText(message.rejected),
          character?.name || '',
          persona?.name || ''
        )
      );

      setMessageRejected(highlightedRejected);
      setRejectedSlopCount(rejectedCount);
    }
  }, [character?.name, persona?.name, message.content, message.rejected]);

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    setContent(message.content);
  };

  const handleSave = async () => {
    try {
      await apiClient.put(`/messages/${message.id}`, { content, rejected: rejected || null });

      const response = await apiClient.get(`/messages/${message.id}/token_count`, {
        params: { model_identifier: modelIdentifier },
      });

      setTokenCount(response.data.token_count);
      setIsEditing(false);
      toast.success('Message updated successfully.');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to update message.');
      console.error('Error saving message:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/messages/${message.id}`);

      toast.success('Message deleted successfully.');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to delete message.');
      console.error('Error deleting message:', error);
    }
  };

  const avatarData = message.author === 'user' ? persona : message.author === 'assistant' ? character : null;
  const wrapperClass = `${warning ? "bg-warningHighlight" : ""} ${showRejected ? "bg-red-950" : "bg-green-950"
    } border-b border-gray-600 pb-4 mb-4 relative flex`;
  const typeLabelClass = showRejected ? 'text-red-100' : 'text-green-100';

  return (
    <div className={wrapperClass}>
      <div className="flex-shrink-0 mr-4">
        {avatarData ? (
          <Avatar
            id={avatarData.id}
            name={avatarData.name}
            type={message.author === 'user' ? 'persona' : 'character'}
            size={120}
          />
        ) : (
          <Avatar seed={message.author} size={120} />
        )}
        <div className="mt-2 text-center text-gray-400 text-sm">
          {persona && message.author === 'user' && (
            <div className="font-bold text-personaHighlight">{persona.name}</div>
          )}
          {character && message.author === 'assistant' && (
            <div className="font-bold text-characterHighlight">{character.name}</div>
          )}
          <div>
            {warning && '⚠️ '}
            {!showRejected ? slopCount > 0 && '🤢 ' : rejectedSlopCount > 0 && '🤢 '}
          </div>
          <div className="font-bold">{message.author}</div>
          <div>[{showRejected ? rejectedTokenCount ?? '...' : tokenCount ?? '...'} tokens]</div>
          {rejected && <div className={typeLabelClass}>{showRejected ? 'Rejected' : 'Chosen'}</div>}
        </div>
      </div>

      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 absolute top-2 right-2">
            {messageRejected && (
              <label className="flex items-center space-x-2">
                <div
                  className={`relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in`}
                >
                  <input
                    type="checkbox"
                    checked={showRejected}
                    onChange={() => setShowRejected(!showRejected)}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    style={{ transition: '0.3s all' }}
                  />
                  <span
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${showRejected ? 'bg-red-600' : 'bg-green-600'
                      }`}
                  ></span>
                </div>
              </label>
            )}

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

        {!isEditing ? (
          <>
            <div
              className="text-gray-300 mt-2 w-11/12"
              dangerouslySetInnerHTML={{
                __html: showRejected ? messageRejected : messageText,
              }}
            />
          </>
        ) : (
          <div>
            <ExpandableTextarea label="Content" onChange={setContent} value={content} />
            {message.author === 'assistant' && <ExpandableTextarea label="Rejected" onChange={setRejected} value={rejected} />}
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
        )}
      </div>

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
