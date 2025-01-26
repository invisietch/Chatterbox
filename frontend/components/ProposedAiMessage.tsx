import { useState, useEffect } from 'react';
import apiClient from '../lib/api';
import { toast } from 'react-toastify';
import {
  extractAndHighlightCodeBlocks,
  highlightPlaceholders,
  highlightText,
} from '../lib/textUtils';
import Avatar from './Avatar';
import { highlightSlop } from '../lib/slop';
import { CheckIcon, RefreshIcon, StopIcon, TrashIcon } from '@heroicons/react/outline';
import { cancelGeneration } from '../lib/aiUtils';
import { useSelector } from 'react-redux';
import { RootState } from '../context/store';

const ProposedAiMessage = ({
  content,
  modelIdentifier,
  conversationId,
  aiInferencing,
  mostRecentMessage,
  errors,
  character,
  persona,
  cancelAuto,
  regenerate,
  onSave,
  onCancel,
}: {
  content: string;
  errors: string;
  conversationId: number;
  aiInferencing: boolean;
  modelIdentifier: string;
  mostRecentMessage: any;
  character: any | null;
  persona: any | null;
  cancelAuto: () => void;
  regenerate: () => void;
  onSave: (msg: any) => void;
  onCancel: () => void;
}) => {
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [message, setMessage] = useState<any>({ author: '', content: '', conversation_id: '' });
  const [messageText, setMessageText] = useState(content);
  const [slopCount, setSlopCount] = useState(0);

  const { realTimeProcessText } = useSelector((state: RootState) => state.quickSettings);
  const { llmUrl } = useSelector((state: RootState) => state.model);

  useEffect(() => {
    if (content == '' && aiInferencing) {
      setMessageText('');
    }
  }, [content, aiInferencing]);

  useEffect(() => {
    const fetchTokenCount = async () => {
      try {
        const response = await apiClient.post(
          `/proposed_messages/token_count?model_identifier=${modelIdentifier}`,
          {
            author: message.author,
            content: message.content,
            conversation_id: conversationId,
          }
        );

        if (response.data) {
          const { token_count } = response.data;
          setTokenCount(token_count);
        }
      } catch (_error) {
        toast.error('Error fetching token count.');
      }
    };

    if (message && !!message.author && !!conversationId && !aiInferencing && !!message.content) {
      fetchTokenCount();
    }
  }, [aiInferencing, message]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  useEffect(() => {
    if (!aiInferencing) {
      window.addEventListener('keydown', handleKeyDown);
    } else {
      window.removeEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aiInferencing]);

  useEffect(() => {
    if (content) {
      if (realTimeProcessText || !aiInferencing) {
        const { processedText, codeBlocks } = extractAndHighlightCodeBlocks(content);

        const { highlightedText, count } = highlightSlop(
          highlightPlaceholders(
            highlightText(processedText), // Apply other highlights only to non-code text
            character?.name || '',
            persona?.name || ''
          )
        );

        // Reinsert code blocks into the highlighted text
        let finalText = highlightedText;
        Object.entries(codeBlocks).forEach(([placeholder, highlightedCode]) => {
          finalText = finalText.replace(placeholder, highlightedCode);
        });

        setMessageText(finalText);
        setSlopCount(count);
      } else {
        setMessageText(content.replaceAll('\n', '<br />'));
      }
    }
  }, [character?.name, persona?.name, content, aiInferencing]);

  const handleRegenerate = async () => {
    await regenerate();
  };

  const handleAbort = async () => {
    await cancelGeneration(llmUrl);
    await cancelAuto();
  };

  useEffect(() => {
    if (content) {
      setMessage({
        author:
          mostRecentMessage.author == 'user'
            ? 'assistant'
            : mostRecentMessage.author == 'assistant'
              ? 'user'
              : 'system',
        content: replaceCharAndUser(content),
        conversation_id: conversationId,
      });
    }
  }, [content, mostRecentMessage, conversationId]);

  const handleSave = async () => {
    if (message && message?.author && message?.content && !aiInferencing) {
      await onSave(message);
      onCancel();
    } else {
      toast.error('Could not save message.');
    }
  };

  const handleReject = async () => {
    if (message && message?.author && message?.content && !aiInferencing) {
      message.rejected = message.content;
      message.content = '';
      await onSave(message);
      onCancel();
    } else {
      toast.error('Could not save message.');
    }
  };

  const handleTrash = async () => {
    await onCancel();
  };

  const replaceCharAndUser = (c: string): string => {
    let newC = c;

    if (newC && character && character.name) {
      newC = newC.replaceAll(character.name, '{{char}}');
    }

    if (newC && persona && persona.name) {
      newC = newC.replaceAll(persona.name, '{{user}}');
    }

    return newC;
  };

  const avatarData =
    message.author === 'user' ? persona : message.author === 'assistant' ? character : null;
  const wrapperClass = `${errors ? 'bg-warningHighlight' : ''} border-fadedYellow border-2 border-dotted bg-dark1 pb-4 mb-4 relative flex rounded-lg`;

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
            {errors && '⚠️ '}
            {slopCount > 0 && '🤢 '}
          </div>
          <div className="font-bold">{message.author}</div>
          <div>[{tokenCount ?? '...'} tokens]</div>
        </div>
      </div>

      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 absolute top-2 right-2">
            {!aiInferencing && message && (
              <>
                <button
                  onClick={handleSave}
                  className="text-fadedGreen hover:text-brightGreen"
                  aria-label="Save Message"
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
                {message.author === 'assistant' && (
                  <button
                    onClick={handleReject}
                    className="text-fadedRed hover:text-brightRed"
                    aria-label="Reject Message"
                  >
                    <CheckIcon className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={handleRegenerate}
                  className="text-fadedYellow hover:text-brightYellow"
                  aria-label="Regenerate message"
                >
                  <RefreshIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleTrash}
                  className="text-fadedRed hover:text-brightRed"
                  aria-label="Trash message"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </>
            )}
            {aiInferencing && (
              <button
                onClick={handleAbort}
                className="text-fadedRed hover:text-brightRed"
                aria-label="Stop Generating"
              >
                <StopIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {messageText.length > 0 ? (
          <div
            className="text-gray-300 w-10/12 mt-2"
            dangerouslySetInnerHTML={{ __html: messageText.trim() }}
          />
        ) : (
          <div className="text-gray-300 w-10/12 mt-2">Generating content...</div>
        )}
      </div>
    </div>
  );
};

export default ProposedAiMessage;
