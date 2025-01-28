import { useState, useEffect, useRef } from 'react';
import apiClient from '../lib/api';
import { toast } from 'react-toastify';
import {
  extractAndHighlightCodeBlocks,
  highlightPlaceholders,
  highlightText,
} from '../lib/textUtils';
import Avatar from './Avatar';
import { highlightSlop } from '../lib/slop';
import ReactDOM from 'react-dom';
import {
  AdjustmentsIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PencilIcon,
  SparklesIcon,
  StopIcon,
  TrashIcon,
} from '@heroicons/react/outline';
import { useSelector } from 'react-redux';
import { RootState } from '../context/store';
import useAiWorker from '../hooks/useAiWorker';
import VariantModal from './VariantModal';

const MessageItem = ({
  message,
  modelIdentifier,
  fetchMessages,
  warning,
  character,
  persona,
  isEditing,
  setIsEditing,
  cancelGeneration,
  alternateGreetings,
  conversationId,
}: {
  message: any;
  modelIdentifier: string;
  fetchMessages: () => void;
  warning: boolean;
  character: any | null;
  persona: any | null;
  isEditing: boolean;
  cancelGeneration: () => void;
  setIsEditing: (t: boolean) => void;
  alternateGreetings: string[] | null;
  conversationId: number;
}) => {
  const [content, setContent] = useState<string>(message.content);
  const [rejected, setRejected] = useState<string>(message.rejected);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [rejectedTokenCount, setRejectedTokenCount] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageRejected, setMessageRejected] = useState('');
  const [slopCount, setSlopCount] = useState(0);
  const [rejectedSlopCount, setRejectedSlopCount] = useState(0);
  const [editRejected, setEditRejected] = useState(false);
  const [greetings, setGreetings] = useState([]);
  const [variants, setVariants] = useState<string[]>(['', '']);
  const [currentContentVariantIndex, setCurrentContentVariantIndex] = useState<number>(0);
  const [currentRejectedVariantIndex, setCurrentRejectedVariantIndex] = useState<number>(1);
  const [prevGreeting, setPrevGreeting] = useState({ exists: false, index: 0 });
  const [nextGreeting, setNextGreeting] = useState({ exists: false, index: 0 });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [genRejected, setGenRejected] = useState('');
  const [genContent, setGenContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { generateWithWorker } = useAiWorker();

  const OUT_OF_BOUNDS = Number.MAX_SAFE_INTEGER;

  const { selectedModel, samplers, samplerOrder, llmUrl, maxContext, engine, apiKey } = useSelector(
    (state: RootState) => state.model
  );

  const { authorsNote, authorsNoteLoc } = useSelector((state: RootState) => {
    const quickSettings = state.quickSettings;

    return {
      rpMode: quickSettings.rpMode,
      authorsNote: quickSettings.authorsNote,
      authorsNoteLoc: quickSettings.authorsNoteLoc,
    };
  });

  useEffect(() => {
    if (message.variants) {
      let localVariants = message.variants;

      if (message.content_variant_index !== null && message.content_variant_index !== undefined) {
        setCurrentContentVariantIndex(message.content_variant_index);
      } else {
        setCurrentContentVariantIndex(OUT_OF_BOUNDS);
      }

      if (message.rejected_variant_index !== null && message.rejected_variant_index !== undefined) {
        setCurrentRejectedVariantIndex(message.rejected_variant_index);
      } else {
        setCurrentRejectedVariantIndex(OUT_OF_BOUNDS);
      }

      setVariants(localVariants);
    } else {
      const localVariants = [];

      if (message.content) {
        localVariants.push(message.content);
        setCurrentContentVariantIndex(localVariants.length - 1);
      } else {
        setCurrentContentVariantIndex(OUT_OF_BOUNDS);
      }

      if (message.rejected) {
        localVariants.push(message.rejected);
        setCurrentRejectedVariantIndex(localVariants.length - 1);
      } else {
        setCurrentRejectedVariantIndex(OUT_OF_BOUNDS);
      }

      setVariants(localVariants);
    }
  }, [message]);

  useEffect(() => {
    const fetchTokenCount = async () => {
      try {
        const response = await apiClient.get(`/messages/${message.id}/token_count`, {
          params: { model_identifier: modelIdentifier },
        });
        setTokenCount(response.data.token_count);
        setRejectedTokenCount(response.data.rejected_token_count);
      } catch (_error) {
        toast.error('Error fetching token count for message.');
      }
    };

    fetchTokenCount();
  }, [message.id, modelIdentifier]);

  useEffect(() => {
    if (alternateGreetings) {
      setGreetings(['{{first_message}}', ...alternateGreetings]);
    }
  }, [message, alternateGreetings]);

  useEffect(() => {
    if (greetings) {
      const idx = greetings.findIndex((greeting) => greeting === message.content);

      if (idx >= 0) {
        if (idx === 0) {
          setPrevGreeting({ exists: false, index: 0 });
          setNextGreeting({ exists: true, index: 1 });
        } else if (idx + 1 === greetings.length) {
          setNextGreeting({ exists: false, index: 0 });
          setPrevGreeting({ exists: true, index: idx - 1 });
        } else {
          setPrevGreeting({ exists: true, index: idx - 1 });
          setNextGreeting({ exists: true, index: idx + 1 });
        }
      } else {
        setPrevGreeting({ exists: false, index: 0 });
        setNextGreeting({ exists: true, index: 1 });
      }
    }
  }, [greetings, message.content]);

  useEffect(() => {
    const { processedText, codeBlocks } = extractAndHighlightCodeBlocks(
      (message.full_content || '').replaceAll('\r', '')
    );

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
        extractAndHighlightCodeBlocks(message.full_rejected.replaceAll('\r', ''));

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

  useEffect(() => {
    const variant = variants[currentContentVariantIndex] ?? '';
    setGenContent(variant);
  }, [currentContentVariantIndex, variants]);

  useEffect(() => {
    const variant = variants[currentRejectedVariantIndex];
    setGenRejected(variant);
  }, [currentRejectedVariantIndex, variants]);

  const handleGenerateVariant = async () => {
    if (!isEditing) {
      setIsEditing(true);
    }
    if (!aiGenerating) {
      setAiGenerating(true);

      if (editRejected) {
        setGenRejected('Generating rejected variant...');
      } else {
        setGenContent('Generating variant...');
      }

      if (!selectedModel || !samplers || !samplerOrder || !llmUrl || !maxContext) {
        toast.error('Missing model configuration.');
        return;
      }

      try {
        const invert = message.author === 'assistant' ? 'no' : 'invert';

        const response = await apiClient.get(
          `/conversations/${conversationId}/with_chat_template`,
          {
            params: {
              invert,
              model_identifier: selectedModel,
              max_length: samplers['max_tokens'],
              max_context: maxContext,
              authors_note: authorsNote || undefined,
              authors_note_loc: authorsNoteLoc || undefined,
              message_id: message.id,
            },
          }
        );

        const { history, eos_token } = response.data;
        const eosTokens = [eos_token];

        if (character) {
          eosTokens.push(`\n${character.name}:`);
        }

        if (persona) {
          eosTokens.push(`\n${persona.name}:`);
        }

        generateWithWorker({
          prompt: history,
          eosTokens,
          samplers,
          samplerOrder,
          llmUrl,
          maxContext,
          engine,
          apiKey,
          onPartial: (partial) => {
            if (!editRejected) {
              setGenContent(partial);
            } else {
              setGenRejected(partial);
            }
          },
          onComplete: ({ text, finishReason }) => {
            setAiGenerating(false);

            if (finishReason !== 'stop') {
              toast.error('Generation did not complete successfully.');
              throw new Error('Invalid finish reason');
            }

            const localVariants = [...variants, text];
            setVariants(localVariants);

            if (isEditing && editRejected) {
              setCurrentRejectedVariantIndex(localVariants.length - 1);
            } else {
              setCurrentContentVariantIndex(localVariants.length - 1);
            }
            toast.success('Variant generated successfully.');
          },
          onError: (err) => {
            toast.error(`Error generating variant: ${err}`);
          },
        });
      } catch (_error) {
        toast.error('Failed to fetch prompt for variant generation.');
      }
    }
  };

  const handleScrollLeft = () => {
    if (editRejected) {
      if (currentRejectedVariantIndex === OUT_OF_BOUNDS) {
        setCurrentRejectedVariantIndex(variants.length - 1);
      } else {
        setCurrentRejectedVariantIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    } else {
      if (currentContentVariantIndex === OUT_OF_BOUNDS) {
        setCurrentContentVariantIndex(variants.length - 1);
      } else {
        setCurrentContentVariantIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    }
  };

  const handleScrollRight = () => {
    if (editRejected) {
      if (currentRejectedVariantIndex === OUT_OF_BOUNDS) {
        setCurrentRejectedVariantIndex(0);
      } else {
        setCurrentRejectedVariantIndex((prev) => (prev < variants.length - 1 ? prev + 1 : prev));
      }
    } else {
      if (currentContentVariantIndex === OUT_OF_BOUNDS) {
        setCurrentContentVariantIndex(0);
      } else {
        setCurrentContentVariantIndex((prev) => (prev < variants.length - 1 ? prev + 1 : prev));
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      contentRef.current?.focus(); // Focus the editable div
    }, 100);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAiGenerating(false);
    setCurrentContentVariantIndex(
      message.content_variant_index
        ? message.content_variant_index
        : (variants.findIndex((v) => v === message.content) ?? OUT_OF_BOUNDS)
    );
    setCurrentRejectedVariantIndex(
      message.rejected_variant_index
        ? message.rejected_variant_index
        : (variants.findIndex((v) => v === message.rejected) ?? OUT_OF_BOUNDS)
    );
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
  };

  const handleSave = async () => {
    try {
      const contentToSave = (await replaceCharAndUser(variants[currentContentVariantIndex])) || '';
      const rejectedToSave =
        (await replaceCharAndUser(variants[currentRejectedVariantIndex])) || '';

      await apiClient.put(`/messages/${message.id}`, {
        content: contentToSave,
        rejected: rejectedToSave ?? null,
        content_variant_index: currentContentVariantIndex,
        rejected_variant_index: variants[currentRejectedVariantIndex]
          ? currentRejectedVariantIndex
          : null,
        // Filter out empty variants.
        variants: variants.filter((v) => !!v),
      });

      const response = await apiClient.get(`/messages/${message.id}/token_count`, {
        params: { model_identifier: modelIdentifier },
      });

      setTokenCount(response.data.token_count);
      setIsEditing(false);

      toast.success('Message updated successfully.');
      fetchMessages();
    } catch (_error) {
      toast.error('Failed to update message.');
    }
  };

  // Only used for greetings.
  const handleSaveGreetingContent = async (greetingText: string) => {
    try {
      const contentToSave = await replaceCharAndUser(greetingText);

      await apiClient.put(`/messages/${message.id}`, { content: contentToSave });

      const response = await apiClient.get(`/messages/${message.id}/token_count`, {
        params: { model_identifier: modelIdentifier },
      });

      setTokenCount(response.data.token_count);
      setIsEditing(false);
      toast.success('Message updated successfully.');
      fetchMessages();
    } catch (_error) {
      toast.error('Failed to update message.');
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/messages/${message.id}`);

      toast.success('Message deleted successfully.');
      fetchMessages();
    } catch (_error) {
      toast.error('Failed to delete message.');
    }
  };

  const handleSetGreeting = async (idx: number) => {
    if (greetings[idx]) {
      await handleSaveGreetingContent(greetings[idx]);
    }
  };

  const handleAbort = async () => {
    await cancelGeneration();
    setAiGenerating(false);
  };

  const avatarData =
    message.author === 'user' ? persona : message.author === 'assistant' ? character : null;
  const wrapperClass = `${warning ? 'bg-warningHighlight' : ''} ${(!isEditing && showRejected) || (isEditing && editRejected)
    ? 'border-fadedRed'
    : 'border-fadedGreen'
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
          <div>[{showRejected ? (rejectedTokenCount ?? '...') : (tokenCount ?? '...')} tokens]</div>
          {rejected && <div className={typeLabelClass}>{showRejected ? 'Rejected' : 'Chosen'}</div>}
        </div>
      </div>

      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 absolute top-2 right-2">
            {message.author === 'assistant' &&
              !alternateGreetings &&
              !aiGenerating &&
              (isEditing || !!messageRejected) && (
                <label className="flex items-center space-x-2">
                  <div
                    className={`relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in`}
                  >
                    <div className="relative inline-block w-12 h-5 mt-1">
                      <input
                        type="checkbox"
                        checked={isEditing ? editRejected : showRejected}
                        onChange={() => {
                          // Keeping these in sync makes the UI more usable.
                          if (isEditing) {
                            setEditRejected(!editRejected);
                            setShowRejected(!editRejected);
                          } else {
                            setEditRejected(!showRejected);
                            setShowRejected(!showRejected);
                          }
                        }}
                        className="toggle-checkbox absolute opacity-0 w-0 h-0"
                      />
                      <span
                        className={`toggle-label block w-full h-full rounded-full cursor-pointer transition-colors duration-300 ${(isEditing && editRejected) || (!isEditing && showRejected) ? 'bg-fadedRed' : 'bg-fadedGreen'}`}
                      ></span>
                      <span
                        className={`toggle-indicator absolute top-0 left-0 w-5 h-5 rounded-full bg-white border-4 transform transition-transform duration-300 ${(isEditing && editRejected) || (!isEditing && showRejected) ? 'translate-x-8' : 'translate-x-0'}`}
                      ></span>
                    </div>
                  </div>
                </label>
              )}

            {!aiGenerating && !alternateGreetings && (
              <button
                onClick={handleGenerateVariant}
                className="text-grey-300 hover:text-brightOrange"
              >
                <SparklesIcon className="h-5 w-5" />
              </button>
            )}

            {isEditing && !alternateGreetings && aiGenerating && (
              <button
                onClick={handleAbort}
                className="text-fadedRed hover:text-brightRed"
                aria-label="Stop Generating"
              >
                <StopIcon className="h-5 w-5" />
              </button>
            )}

            {isEditing && (
              <>
                {!alternateGreetings && !aiGenerating && (
                  <>
                    <button
                      disabled={
                        variants.length === 0 ||
                        aiGenerating ||
                        (editRejected &&
                          currentRejectedVariantIndex <= 0 &&
                          currentRejectedVariantIndex !== OUT_OF_BOUNDS) ||
                        (!editRejected &&
                          currentContentVariantIndex <= 0 &&
                          currentContentVariantIndex !== OUT_OF_BOUNDS)
                      }
                      onClick={handleScrollLeft}
                      className={`text-grey-300 ${!aiGenerating && variants.length > 1 && !(editRejected && currentRejectedVariantIndex <= 0) && !(!editRejected && currentContentVariantIndex <= 0) && 'hover:text-brightOrange'}`}
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                    </button>

                    <button
                      disabled={variants.length <= 1 || aiGenerating}
                      className={
                        variants.length > 1 && !aiGenerating ? 'hover:text-brightOrange' : ''
                      }
                      onClick={() => setIsModalOpen(true)}
                    >
                      <AdjustmentsIcon className="h-5 w-5" />
                    </button>

                    <button
                      disabled={
                        variants.length === 0 ||
                        aiGenerating ||
                        (editRejected &&
                          currentRejectedVariantIndex >= variants.length - 1 &&
                          currentRejectedVariantIndex !== OUT_OF_BOUNDS) ||
                        (!editRejected &&
                          currentContentVariantIndex >= variants.length - 1 &&
                          currentContentVariantIndex !== OUT_OF_BOUNDS)
                      }
                      onClick={handleScrollRight}
                      className={`text-grey-300 ${!aiGenerating && variants.length > 1 && !(editRejected && currentRejectedVariantIndex >= variants.length - 1) && !(!editRejected && currentContentVariantIndex >= variants.length - 1) && 'hover:text-brightOrange'}`}
                    >
                      <ArrowRightIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
                {isModalOpen && (
                  <VariantModal
                    vs={variants}
                    isAssistant={message.author === 'assistant'}
                    avatarData={{
                      id:
                        message.author === 'assistant'
                          ? character.id
                          : message.author === 'user'
                            ? persona.id
                            : 0,
                      type:
                        message.author === 'assistant'
                          ? 'character'
                          : message.author === 'user'
                            ? 'persona'
                            : 'system',
                      name:
                        message.author === 'assistant'
                          ? character.name
                          : message.author === 'user'
                            ? persona.name
                            : 'System',
                    }}
                    onClose={() => setIsModalOpen(false)}
                    onSave={async (ci, ri) => {
                      if (ci !== null) {
                        setCurrentContentVariantIndex(ci);
                      }
                      if (ri === -2) {
                        setRejected('');
                        setCurrentRejectedVariantIndex(OUT_OF_BOUNDS);
                      } else if (ri !== null) {
                        setCurrentRejectedVariantIndex(ri);
                      }

                      setIsModalOpen(false);
                    }}
                  />
                )}
              </>
            )}

            {!isEditing && !showRejected && greetings.length > 1 && (
              <button
                disabled={!prevGreeting.exists}
                onClick={() => handleSetGreeting(prevGreeting.index)}
                className={
                  !prevGreeting.exists ? 'text-grey-700' : 'text-grey-300 hover:text-yellow-300'
                }
                aria-label="Prev message"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            )}

            {!isEditing && !showRejected && greetings.length > 1 && (
              <button
                disabled={!nextGreeting.exists}
                onClick={() => handleSetGreeting(nextGreeting.index)}
                className={
                  !nextGreeting.exists ? 'text-grey-700' : 'text-grey-300 hover:text-yellow-300'
                }
                aria-label="Next message"
              >
                <ArrowRightIcon className="h-5 w-5" />
              </button>
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
            contentEditable={!aiGenerating}
            suppressContentEditableWarning={true}
            className="text-gray-300 mt-2 w-10/12 h-full outline-none flex-grow"
            style={{ whiteSpace: 'pre-wrap' }}
            onBlur={(e) => {
              const updatedText = e.currentTarget.innerText.trim();

              if (editRejected) {
                if (!variants[currentRejectedVariantIndex] && updatedText) {
                  const localVariants = [...variants, updatedText];
                  setCurrentRejectedVariantIndex(localVariants.length - 1);
                  setVariants(localVariants);
                } else if (updatedText === '') {
                  setCurrentRejectedVariantIndex(OUT_OF_BOUNDS);
                } else {
                  const newVariants = variants.map((v, idx) =>
                    idx === currentRejectedVariantIndex ? updatedText : v
                  );

                  setVariants(newVariants);
                }
              } else {
                if (!variants[currentContentVariantIndex] && updatedText) {
                  const localVariants = [...variants, updatedText];
                  setCurrentContentVariantIndex(localVariants.length - 1);
                  setVariants(localVariants);
                } else if (updatedText === '') {
                  setCurrentContentVariantIndex(OUT_OF_BOUNDS);
                } else {
                  const newVariants = variants.map((v, idx) =>
                    idx === currentContentVariantIndex ? updatedText : v
                  );

                  setVariants(newVariants);
                }
              }
            }}
          >
            {editRejected ? genRejected || rejected : genContent || content}
          </div>
        ) : (
          <div
            ref={contentRef}
            className="text-gray-300 mt-2 w-10/12"
            dangerouslySetInnerHTML={{
              __html: !showRejected ? messageText : messageRejected,
            }}
          />
        )}

        {isEditing && (
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              type="button"
              disabled={aiGenerating}
              onClick={handleCancel}
              className={`px-4 py-2 bg-dark1 text-white rounded ${!aiGenerating && 'hover:bg-dark2'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={aiGenerating}
              className={`px-4 py-2 bg-fadedGreen text-white rounded ${!aiGenerating && 'hover:bg-brightGreen'}`}
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
