import { useState, useEffect, useRef } from 'react';
import apiClient from '../lib/api';
import { toast } from 'react-toastify';
import { extractAndHighlightCodeBlocks, highlightPlaceholders, highlightText } from '../lib/textUtils';
import Avatar from './Avatar';
import { highlightSlop } from '../lib/slop';
import ReactDOM from 'react-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/outline';

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
  const [messageText, setMessageText] = useState('');
  const [messageRejected, setMessageRejected] = useState('');
  const [slopCount, setSlopCount] = useState(0);
  const [rejectedSlopCount, setRejectedSlopCount] = useState(0);
  const [editRejected, setEditRejected] = useState(false);
  const [newContent, setNewContent] = useState(message.content);
  const [newRejected, setNewRejected] = useState(message.rejected);
  const contentRef = useRef<HTMLDivElement>(null);

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
    const { processedText, codeBlocks } = extractAndHighlightCodeBlocks(message.full_content || '');

    const { highlightedText, count } = highlightSlop(
      highlightPlaceholders(
        highlightText(processedText),
        character?.name || '',
        persona?.name || ''
      )
    );

    let finalText = highlightedText;
    Object.entries(codeBlocks).forEach(([placeholder, highlightedCode]) => {
      finalText = finalText.replace(placeholder, highlightedCode);
    });

    setMessageText(finalText);
    setSlopCount(count);

    if (message.rejected) {
      const { processedText: rejectedProcessed, codeBlocks: rejectedCodeBlocks } =
        extractAndHighlightCodeBlocks(message.full_rejected);

      const { highlightedText: highlightedRejected, count: rejectedCount } = highlightSlop(
        highlightPlaceholders(
          highlightText(rejectedProcessed),
          character?.name || '',
          persona?.name || ''
        )
      );

      let finalRejectedText = highlightedRejected;
      Object.entries(rejectedCodeBlocks).forEach(([placeholder, highlightedCode]) => {
        finalRejectedText = finalRejectedText.replace(placeholder, highlightedCode);
      });

      setMessageRejected(finalRejectedText);
      setRejectedSlopCount(rejectedCount);
    }
  }, [character?.name, persona?.name, message.content, message.rejected]);

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      contentRef.current?.focus(); // Focus the editable div
    }, 100);
  }

  const handleCancel = () => {
    setIsEditing(false);
    setContent(message.content);
    setRejected(message.rejected);
  };

  const replaceCharAndUser = async (c: string): Promise<string> => {
    if (!c) {
      return '';
    }
    let newC = c;

    if (newC && character && character.name) {
      newC = newC.replaceAll(character.name, '{{char}}');
    }

    if (newC && persona && persona.name) {
      newC = newC.replaceAll(persona.name, '{{user}}');
    }

    return newC.trim();
  }

  const handleSave = async () => {
    try {
      const contentToSave = await replaceCharAndUser(newContent);
      const rejectedToSave = await replaceCharAndUser(newRejected);

      await apiClient.put(`/messages/${message.id}`, {
        content: contentToSave,
        rejected: rejectedToSave,
      });

      const response = await apiClient.get(`/messages/${message.id}/token_count`, {
        params: { model_identifier: modelIdentifier },
      });

      setTokenCount(response.data.token_count);
      setIsEditing(false);
      toast.success('Message updated successfully.');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to update message.');
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/messages/${message.id}`);

      toast.success('Message deleted successfully.');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to delete message.');
    }
  };

  const avatarData = message.author === 'user' ? persona : message.author === 'assistant' ? character : null;
  const wrapperClass = `${warning ? 'bg-warningHighlight' : ''} ${(!isEditing && showRejected) || (isEditing && editRejected) ? 'border-fadedRed' : 'border-fadedGreen'
    } border-2 bg-dark pb-4 mb-4 pt-2 relative flex rounded-lg ${isEditing && 'border-dashed'}`;
  const typeLabelClass = showRejected ? 'text-brightRed' : 'text-brightGreen';

  return (
    <div className={wrapperClass}>
      <div className="flex-shrink-0 mr-4 p-4 ml-2">
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
            {message.author === 'assistant' && (isEditing || !!messageRejected) && (
              <label className="flex items-center space-x-2">
                <div
                  className={`relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in`}
                >
                  <div className="relative inline-block w-12 h-5 mt-1">
                    <input
                      type="checkbox"
                      checked={isEditing ? editRejected : showRejected}
                      onChange={isEditing ? () => {
                        if (editRejected) {
                          setRejected(newRejected);
                        } else {
                          setContent(newContent);
                        }
                        setEditRejected(!editRejected)
                      } : () => {
                        setShowRejected(!showRejected)
                      }}
                      className="toggle-checkbox absolute opacity-0 w-0 h-0"
                    />
                    <span
                      className={`toggle-label block w-full h-full rounded-full cursor-pointer transition-colors duration-300 ${(isEditing && editRejected) || showRejected ? 'bg-fadedRed' : 'bg-fadedGreen'}`}
                    ></span>
                    <span
                      className={`toggle-indicator absolute top-0 left-0 w-5 h-5 rounded-full bg-white border-4 transform transition-transform duration-300 ${(isEditing && editRejected) || showRejected ? 'translate-x-8' : 'translate-x-0'}`}
                    ></span>
                  </div>
                </div>
              </label>
            )}

            {!isEditing && (
              <button
                onClick={handleEdit}
                className="text-grey-300 hover:text-yellow-300"
                aria-label="Edit message"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}

            {!isEditing && (
              <button
                onClick={() => setIsDeleting(true)}
                className="text-grey-300 hover:text-red-300"
                aria-label="Delete message"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div
            ref={contentRef}
            contentEditable={true}
            suppressContentEditableWarning={true}
            className='text-gray-300 mt-2 w-10/12 rounded p-2 outline-none'
            style={{ whiteSpace: 'pre-wrap' }}
            onInput={(e) => {
              const updatedText = e.currentTarget.innerText.trim();
              console.log(updatedText);

              if (!editRejected && updatedText !== newContent) {
                setNewContent(updatedText);
              } else if (editRejected && updatedText !== newRejected) {
                setNewRejected(updatedText);
              }
            }}
          >
            {editRejected ? rejected : content}
          </div>
        ) : (
          <div
            ref={contentRef}
            className="text-gray-300 mt-2 w-10/12"
            dangerouslySetInnerHTML={{
              __html: !showRejected ? messageText : messageRejected
            }}
          />
        )}

        {isEditing && (
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-fadedGreen text-white rounded hover:bg-brightGreen"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {isDeleting &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
            <div className="bg-dark p-6 rounded-lg max-w-sm w-full">
              <h3 className="text-lg font-bold text-white mb-4">
                Are you sure you want to delete this message?
              </h3>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsDeleting(false)}
                  className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-fadedRed text-white rounded hover:bg-brightRed"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body // Portal to the <body> element
        )}
    </div>
  );
};

export default MessageItem;
