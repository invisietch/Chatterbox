import { useState, useEffect } from 'react';
import { highlightSlop } from '../lib/slop';
import MessageItem from './MessageItem';
import Accordion from './Accordion';
import AddMessageForm from './AddMessageForm';
import apiClient from '../lib/api';
import { toast } from 'react-toastify';

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
  modelIdentifier: string,
  onMessagesChange: (t: boolean) => void,
  character: any,
  persona: any,
  prompt: any,
  expanded: boolean,
  setExpanded: (t: boolean) => void,
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMessage, setIsAddingMessage] = useState(false);
  const [mostRecentMessage, setMostRecentMessage] = useState<any | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]); // State to store warnings
  const [warningIds, setWarningIds] = useState<number[]>([]);
  const [editingId, setEditingId] = useState(null);

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (messages.length === 0 && (character || prompt)) {
        createSystemMessage();
      } else if (
        messages.length === 1 &&
        messages[0].author === "system" &&
        character
      ) {
        createFirstMessage();
      } else {
        setIsAddingMessage(true);
      }
    }
  };

  useEffect(() => {
    if (!isAddingMessage && !editingId && expanded) {
      window.addEventListener("keydown", handleKeyPress);
    } else {
      window.removeEventListener("keydown", handleKeyPress);
    }

    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isAddingMessage, editingId, messages, expanded]);

  // Fetch messages for the conversation
  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/conversations/${conversationId}/messages`);
      const sortedMessages = response.data.sort((a: any, b: any) => a.order - b.order);
      const messagesWithSlopEnhancement = sortedMessages.map(message => {
        const { highlightedText, count } = highlightSlop(message.content);

        return {
          ...message,
          highlightedText: highlightedText,
          slopCount: count
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
    } catch (error) {
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
        warningIds.push(messages[i].id)
      }
    }

    // Warning 2: Two consecutive user messages
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].author === 'user' && messages[i - 1]?.author === 'user') {
        warnings.push('There are two consecutive user messages.');
        warningIds.push(messages[i].id)
      }
    }

    // Warning 3: Two consecutive assistant messages
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].author === 'assistant' && messages[i - 1]?.author === 'assistant') {
        warnings.push('There are two consecutive assistant messages.');
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

  const handleSaveMessage = async (newMessage: any) => {
    try {
      const response = await apiClient.post(`/conversations/${conversationId}/messages`, newMessage);
      if (response.status === 200) {
        const savedMessage = response.data; // Assuming the API returns the saved message with its ID and other properties
        const prevMessages = messages;

        // Update the messages state
        setMessages([...prevMessages, savedMessage]);
        setMostRecentMessage(savedMessage);

        const newWarnings = checkForWarnings([...prevMessages, savedMessage]);
        setWarnings(newWarnings);

        toast.success('Message saved successfully.');
        setIsAddingMessage(false); // Hide the form after saving
        onMessagesChange(true); // Notify parent component of change
      } else {
        toast.error('Failed to save message.');
      }
    } catch (error) {
      toast.error('Failed to save message.');
    }
  };


  const createFirstMessage = async () => {
    const newMessage = {
      author: 'assistant',
      content: character.first_message || ""
    };

    await handleSaveMessage(newMessage);
  };

  const createSystemMessage = async () => {
    let content = '';

    if (prompt) {
      content += `System Instructions: ${prompt.content}\n\n`;
    }

    if (character) {
      content += `About ${character.name}: ${character.description}\n`;
      if (character.personality) content += `Personality: ${character.personality}\n`;
      if (character.scenario) content += `Scenario: ${character.scenario}\n\n`;
    }

    if (persona) {
      content += `About ${persona.name}: ${persona.content}\n`;
    }

    const newMessage = {
      author: 'system',
      content,
    };

    await handleSaveMessage(newMessage);
  }

  const accordionTitle = `${warnings.length > 0 ? "⚠️ " : ""} Messages (${messages.length})`;

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
        messages.map((message) => (
          <MessageItem
            key={message.id}
            isEditing={message.id === editingId}
            setIsEditing={(t: boolean) => t ? setEditingId(message.id) : setEditingId(null)}
            message={message}
            modelIdentifier={modelIdentifier}
            fetchMessages={fetchMessages}
            warning={warningIds.includes(message.id)}
            character={character || null}
            persona={persona || null}
          />
        ))
      ) : (
        <div>No messages found.</div>
      )}

      {!isAddingMessage && messages.length == 0 && (character || persona || prompt) && (
        <div className="mt-4 text-center">
          <button
            onClick={() => createSystemMessage()}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-blue-600"
          >
            + Create System Message
          </button>
        </div>
      )}

      {!isAddingMessage && messages.length == 1 && messages[0].author == 'system' && character && (
        <div className="mt-4 text-center">
          <button
            onClick={() => createFirstMessage()}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-blue-600"
          >
            + Add Character First Message
          </button>
        </div>
      )}

      {/* Add new message button */}
      {!isAddingMessage && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsAddingMessage(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Add New Message
          </button>
        </div>
      )}

      {/* Message form */}
      {isAddingMessage && (
        <AddMessageForm
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
