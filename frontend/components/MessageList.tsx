import { useState, useEffect, useRef } from 'react';
import { highlightSlop } from '../lib/slop';
import MessageItem from './MessageItem';
import Accordion from './Accordion';
import AddMessageForm from './AddMessageForm';
import apiClient from '../lib/api';
import { toast } from 'react-toastify';
import { FastForwardIcon, PlusIcon, SparklesIcon, StopIcon } from '@heroicons/react/outline';
import ProposedAiMessage from './ProposedAiMessage';
import { useSelector } from 'react-redux';
import { RootState } from '../context/store';
import useAiWorker from '../hooks/useAiWorker';

const MessageList = ({
  conversationId,
  modelIdentifier,
  onMessagesChange,
  character,
  persona,
  prompt,
  expanded,
  setExpanded,
}: {
  conversationId: number;
  modelIdentifier: string;
  onMessagesChange: (t: boolean) => void;
  character: any;
  persona: any;
  prompt: any;
  expanded: boolean;
  setExpanded: (t: boolean) => void;
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMessage, setIsAddingMessage] = useState(false);
  const [mostRecentMessage, setMostRecentMessage] = useState<any | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]); // State to store warnings
  const [warningIds, setWarningIds] = useState<number[]>([]);
  const [editingId, setEditingId] = useState(null);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [generationErrors, setGenerationErrors] = useState('');
  const [aiInferencing, setAiInferencing] = useState(false);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const isAutoGeneratingRef = useRef(isAutoGenerating);
  const [generationLock, setGenerationLock] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { generateWithWorker, terminateWorker } = useAiWorker();

  useEffect(() => {
    isAutoGeneratingRef.current = isAutoGenerating;
  }, [isAutoGenerating]);

  const { selectedModel, samplers, samplerOrder, llmUrl, maxContext } = useSelector(
    (state: RootState) => state.model
  );

  const { rpMode, authorsNote, authorsNoteLoc } = useSelector((state: RootState) => {
    const quickSettings = state.quickSettings;

    return {
      rpMode: quickSettings.rpMode,
      authorsNote: quickSettings.authorsNote,
      authorsNoteLoc: quickSettings.authorsNoteLoc,
    };
  });

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (messages) {
      // Scroll to bottom after 200ms. This gives messages time to render on a re-fetch.
      setTimeout(scrollToBottom, 200);
    }
  }, [messages, isGeneratingMessage, isAddingMessage, expanded]);

  const autoGenerateResponses = async () => {
    setIsAutoGenerating(true);
    isAutoGeneratingRef.current = true;

    let localMostRecent = mostRecentMessage;

    while (isAutoGeneratingRef.current) {
      try {
        if (generationLock) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }

        setGenerationLock(true);

        const newText = await generateResponse(localMostRecent);

        if (newText) {
          const newMessage = {
            author: localMostRecent?.author === 'assistant' ? 'user' : 'assistant',
            content: newText,
            conversation_id: conversationId,
          };

          const result = await handleSaveMessage(newMessage);

          if (result) {
            const { savedMessage } = result;
            // Update our local variables
            localMostRecent = savedMessage;
            setIsGeneratingMessage(false);
          }
        } else {
          break;
        }
      } catch (_error) {
        toast.error('Error during auto-generation.');
      } finally {
        setGenerationLock(false);
      }
    }

    setIsAutoGenerating(false);
  };

  const stopAutoGeneration = () => {
    setIsAutoGenerating(false);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (messages.length === 0 && (character || prompt)) {
        createSystemMessage();
      } else if (messages.length === 1 && messages[0].author === 'system' && character) {
        createFirstMessage();
      } else if (mostRecentMessage.author === 'assistant') {
        setIsAddingMessage(true);
      } else {
        generateResponse();
      }
    }
  };

  useEffect(() => {
    if (!isAddingMessage && !editingId && !isGeneratingMessage && expanded) {
      window.addEventListener('keydown', handleKeyPress);
    } else {
      window.removeEventListener('keydown', handleKeyPress);
    }

    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAddingMessage, editingId, messages, isGeneratingMessage, expanded, rpMode]);

  // Fetch messages for the conversation
  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/conversations/${conversationId}/messages`);
      const sortedMessages = response.data.sort((a: any, b: any) => a.order - b.order);
      const messagesWithSlopEnhancement = sortedMessages.map((message) => {
        const { highlightedText, count } = highlightSlop(message.content || '');

        return {
          ...message,
          highlightedText: highlightedText,
          slopCount: count,
        };
      });

      setMessages(messagesWithSlopEnhancement);
      onMessagesChange(true);

      // Get the most recent message (highest 'order') by picking the last item after sorting
      const recentMessage = sortedMessages[sortedMessages.length - 1] || null;
      setMostRecentMessage(recentMessage);

      // Check for warnings
      const newWarnings = checkForWarnings(sortedMessages);
      setWarnings(newWarnings);
    } catch (_error) {
      toast.error('Error fetching messages.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check for warnings
  const checkForWarnings = (messages: any[]) => {
    const warnings: string[] = [];
    const warningIds: number[] = [];

    // Warning 1: System message is not the first message
    for (let i = 0; i < messages.length; i++) {
      if (i !== 0 && messages[i].author === 'system') {
        warnings.push('There is a system message which is not the first message.');
        warningIds.push(messages[i].id);
      }
    }

    // Warning 2: Two consecutive user messages
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].author === 'user' && messages[i - 1]?.author === 'user') {
        warnings.push('There are two consecutive user messages.');
        warningIds.push(messages[i].id);
      }
    }

    // Warning 3: Two consecutive assistant messages
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].author === 'assistant' && messages[i - 1]?.author === 'assistant') {
        warnings.push('There are two consecutive assistant messages.');
        warningIds.push(messages[i].id);
      }
    }

    for (let i = 0; i < messages.length; i++) {
      if (messages[i].content === '') {
        warnings.push('There are messages without content.');
        warningIds.push(messages[i].id);
      }
    }

    setWarningIds(warningIds);
    return warnings;
  };

  // Fetch messages when the component mounts or conversationId changes
  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

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

  const handleSaveMessage = async (newMessage: any) => {
    try {
      const newContent = (await replaceCharAndUser(newMessage.content.trim())) || '';
      const newRejected = (await replaceCharAndUser(newMessage.rejected?.trim())) || null;
      const variants = [];

      if (newContent) {
        variants.push(newContent);
      }
      if (newRejected) {
        variants.push(newRejected);
      }

      const localMessage = {
        ...newMessage,
        content: newContent,
        rejected: newMessage.author === 'assistant' ? newRejected : null,
        content_variant_index: newContent ? 0 : null,
        rejected_variant_index: !newMessage.author || !newRejected ? null : newContent ? 1 : 0,
        variants,
      };
      const response = await apiClient.post(
        `/conversations/${conversationId}/messages`,
        localMessage
      );
      if (response.status === 200) {
        const savedMessage = response.data; // Assuming the API returns the saved message with its ID and other properties

        setMessages((prevMessages) => [...prevMessages, savedMessage]);
        setMostRecentMessage(savedMessage);

        const newWarnings = checkForWarnings(messages);
        setWarnings(newWarnings);

        setIsAddingMessage(false); // Hide the form after saving
        onMessagesChange(true); // Notify parent component of change
        toast.success('Message saved successfully.');

        if (rpMode && !isAutoGenerating && savedMessage.author === 'user') {
          await generateResponse(savedMessage, true);
        }

        return { savedMessage };
      } else {
        toast.error('Failed to save message.');
      }
    } catch (_error) {
      toast.error('Failed to save message.');
    }
  };

  useEffect(() => {
    return () => {
      terminateWorker(); // Clean up worker on unmount
    };
  }, []);

  const generateResponse = async (mostRecent?: any, autoSave: boolean = false): Promise<string> => {
    setIsGeneratingMessage(true);
    setAiInferencing(true);
    setGeneratedResponse('');

    const localMostRecent = mostRecent || mostRecentMessage;

    if (selectedModel && samplers && samplerOrder && llmUrl && maxContext) {
      const invert = localMostRecent?.author === 'assistant' ? 'invert' : 'no';
      const authorsNoteQs = authorsNote ? `&authors_note=${encodeURIComponent(authorsNote)}` : '';
      const authorsNoteLocQs =
        authorsNote && authorsNoteLoc ? `&authors_note_loc=${authorsNoteLoc}` : '';
      const response = await apiClient.get(
        `/conversations/${conversationId}/with_chat_template?model_identifier=${selectedModel}&invert=${invert}&max_length=${samplers['max_tokens']}&max_context=${maxContext}${authorsNoteQs}${authorsNoteLocQs}`
      );
      const { history, eos_token } = response.data;
      const eosTokens = [eos_token];

      if (character) {
        eosTokens.push(`\n${character.name}:`);
      }

      if (persona) {
        eosTokens.push(`\n${persona.name}:`);
      }

      return new Promise((resolve, reject) => {
        generateWithWorker({
          prompt: history,
          eosTokens,
          samplers,
          samplerOrder,
          llmUrl,
          maxContext,
          onPartial: (partial) => {
            setGeneratedResponse(partial); // Update UI with partial results
          },
          onComplete: async ({ text, finishReason }) => {
            setAiInferencing(false);

            if (
              rpMode &&
              localMostRecent &&
              !isAutoGenerating &&
              autoSave &&
              finishReason === 'stop'
            ) {
              const newMessage = {
                author: localMostRecent?.author === 'assistant' ? 'user' : 'assistant',
                content: text,
                conversation_id: conversationId,
              };

              const result = await handleSaveMessage(newMessage);

              if (result) {
                setIsGeneratingMessage(false);
                setIsAddingMessage(true);
              }
            }

            resolve(finishReason === 'stop' ? text : null);
          },
          onError: (err) => {
            setAiInferencing(false);
            setIsGeneratingMessage(false);
            toast.error(`Error during generation: ${err}`);
            reject(err);
          },
        });
      });
    } else {
      toast.error(
        'Please select a preset in the settings menu (cog in the top right). Cannot generate without a preset.'
      );
      setAiInferencing(false);
      setIsGeneratingMessage(false);
      return ''; // Return empty since generation can't proceed
    }
  };

  const createFirstMessage = async () => {
    const newMessage = {
      author: 'assistant',
      content: '{{first_message}}',
    };

    const { savedMessage } = await handleSaveMessage(newMessage);

    if (savedMessage && rpMode) {
      setIsAddingMessage(true);
    }
  };

  const createSystemMessage = async () => {
    let content = '';

    if (prompt) {
      content += 'System Instructions:\n{{system_prompt}}\n\n';
    }

    if (character) {
      content += `About ${character.name}:\n{{description}}\n\n`;
      if (character.personality) content += 'Personality:\n{{personality}}\n\n';
      if (character.scenario) content += 'Scenario:\n{{scenario}}\n\n';
    }

    if (persona) {
      content += `About ${persona.name}:\n{{persona}}\n\n`;
    }

    const newMessage = {
      author: 'system',
      content,
    };

    const { savedMessage } = await handleSaveMessage(newMessage);

    if (savedMessage && rpMode) {
      createFirstMessage();
    }
  };

  const accordionTitle = `${warnings.length > 0 ? '⚠️ ' : ''} Messages (${messages.length})`;

  return (
    <Accordion title={accordionTitle} isOpen={expanded} onToggle={setExpanded}>
      {warnings.length > 0 && (
        <div className="bg-orange-500 text-white p-4 mb-4 rounded">
          <h4 className="font-bold">Warning: This dataset has the following issues:</h4>
          <ul>
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
          <h4 className="font-bold">Some chat formats may not be able to process this dataset.</h4>
        </div>
      )}

      {isLoading ? (
        <div>Loading messages...</div>
      ) : messages.length > 0 ? (
        messages.map((message, i, arr) => (
          <>
            {arr.length - 1 === i && <div ref={messagesEndRef} />}
            <MessageItem
              conversationId={conversationId}
              key={message.id}
              isEditing={message.id === editingId}
              setIsEditing={(t: boolean) => (t ? setEditingId(message.id) : setEditingId(null))}
              message={message}
              modelIdentifier={modelIdentifier}
              fetchMessages={fetchMessages}
              warning={warningIds.includes(message.id)}
              character={character || null}
              persona={persona || null}
              alternateGreetings={
                character &&
                i === 1 &&
                message.author === 'assistant' &&
                character.alternate_greetings
                  ? character.alternate_greetings
                  : null
              }
            />
          </>
        ))
      ) : (
        <div>No messages found.</div>
      )}

      {isGeneratingMessage && (
        <ProposedAiMessage
          modelIdentifier={modelIdentifier}
          conversationId={conversationId}
          character={character}
          persona={persona}
          cancelAuto={stopAutoGeneration}
          aiInferencing={aiInferencing}
          content={generatedResponse}
          errors={generationErrors}
          mostRecentMessage={mostRecentMessage}
          onSave={handleSaveMessage}
          regenerate={generateResponse}
          onCancel={() => {
            setGeneratedResponse('');
            setGenerationErrors('');
            setIsGeneratingMessage(false);
          }}
        />
      )}

      {!isAddingMessage && messages.length == 0 && (character || persona || prompt) && (
        <div className="mt-4 text-center">
          <button
            onClick={() => createSystemMessage()}
            className="px-4 py-2 bg-fadedYellow text-white rounded hover:bg-brightYellow"
          >
            + Create System Message
          </button>
        </div>
      )}

      {!isAddingMessage && messages.length == 1 && messages[0].author == 'system' && character && (
        <div className="mt-4 text-center">
          <button
            onClick={() => createFirstMessage()}
            className="px-4 py-2 bg-fadedYellow text-white rounded hover:bg-brightYellow"
          >
            + Add Character First Message
          </button>
        </div>
      )}

      {/* Add new message button */}
      {!isAddingMessage && (
        <div className="mt-4 text-center">
          {!isAutoGenerating && !isGeneratingMessage && (
            <button
              onClick={() => setIsAddingMessage(true)}
              className="px-4 py-2 bg-fadedGreen text-white rounded hover:bg-brightGreen"
            >
              <PlusIcon className="h-6 w-6" />
            </button>
          )}
          {messages.length >= 2 && (
            <>
              {!isAutoGenerating && !isGeneratingMessage && (
                <button
                  onClick={generateResponse}
                  className="ml-2 bg-fadedYellow hover:bg-brightYellow text-white font-bold py-2 px-4 rounded"
                >
                  <SparklesIcon className="h-6 w-6" />
                </button>
              )}
              {!isAutoGenerating && !isGeneratingMessage && (
                <button
                  onClick={autoGenerateResponses}
                  className="ml-2 bg-fadedAqua hover:bg-brightAqua text-white font-bold py-2 px-4 rounded"
                >
                  <FastForwardIcon className="h-6 w-6" />
                </button>
              )}
              {isAutoGenerating && (
                <button
                  onClick={stopAutoGeneration}
                  className="ml-2 bg-fadedRed hover:bg-brightRed text-white font-bold py-2 px-4 rounded"
                >
                  <StopIcon className="h-6 w-6" />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {isAddingMessage && (
        <AddMessageForm
          modelIdentifier={modelIdentifier}
          conversationId={conversationId}
          character={character}
          persona={persona}
          mostRecentMessage={mostRecentMessage}
          onSave={handleSaveMessage}
          onCancel={() => setIsAddingMessage(false)}
        />
      )}
    </Accordion>
  );
};

export default MessageList;
