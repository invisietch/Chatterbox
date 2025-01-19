import { useEffect, useRef, useState } from "react";
import ExpandableTextarea from "./ExpandableTextarea";
import apiClient from "../lib/api";

const AddMessageForm = ({
  conversationId,
  mostRecentMessage,
  modelIdentifier,
  character,
  persona,
  onSave,
  onCancel,
}: {
  conversationId: number;
  character: any;
  modelIdentifier: string;
  persona: any;
  mostRecentMessage: any | null;
  onSave: (message: any) => void;
  onCancel: () => void;
}) => {
  const [author, setAuthor] = useState("system");
  const [content, setContent] = useState("");
  const [rejected, setRejected] = useState("");
  const [contentTokenCount, setContentTokenCount] = useState(0);
  const [rejectedTokenCount, setRejectedTokenCount] = useState(0);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const lastCallTimestamp = useRef<number | null>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.focus(); // Automatically focus the content field
    }
  }, []);

  const fetchTokenCount = async () => {
    try {
      const response = await apiClient.post(
        `/proposed_messages/token_count?model_identifier=${modelIdentifier}`,
        {
          author,
          content,
          rejected: author === "assistant" ? rejected : null,
          conversation_id: conversationId,
        }
      );

      if (response.data) {
        const { token_count, rejected_token_count } = response.data;
        setContentTokenCount(token_count);
        setRejectedTokenCount(rejected_token_count || 0);
      }
    } catch (error) {
      console.error("Error fetching token count:", error);
    }
  };

  const throttledFetchTokenCount = () => {
    const now = Date.now();
    const lastCall = lastCallTimestamp.current;

    if (!lastCall || now - lastCall >= 1000) {
      lastCallTimestamp.current = now;
      fetchTokenCount();
    }
  };

  // Trigger token count throttling whenever content or rejected changes
  useEffect(() => {
    throttledFetchTokenCount();
  }, [author, content, rejected]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const replaceCharAndUser = (c: string): string => {
    let newC = c;

    if (newC && character && character.name) {
      newC = newC.replaceAll(character.name, "{{char}}");
    }

    if (newC && persona && persona.name) {
      newC = newC.replaceAll(persona.name, "{{user}}");
    }

    return newC;
  };

  useEffect(() => {
    if (mostRecentMessage) {
      setAuthor(
        mostRecentMessage.author === "user" || mostRecentMessage.author === "system"
          ? "assistant"
          : "user"
      );
    } else {
      setAuthor("system");
    }
  }, [mostRecentMessage]);

  const handleSubmit = (e?: React.FormEvent) => {
    e && e.preventDefault();

    if (content.trim()) {
      onSave({
        conversationId,
        author,
        content: replaceCharAndUser(content),
        rejected: author === "assistant" && rejected ? replaceCharAndUser(rejected) : null,
      });
      setContent(""); // Clear content after saving
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <div className="pb-1 relative">
          <h3>Author</h3>
        </div>
        <div className="flex flex-col items-center p-4">
          <select
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="p-2 border rounded bg-dark text-gray-200 w-full mt-1"
          >
            <option value="system">System</option>
            <option value="user">User</option>
            <option value="assistant">Assistant</option>
          </select>
        </div>
      </div>

      <ExpandableTextarea
        label={`Message Content [${contentTokenCount} tokens]`}
        ref={contentRef}
        onChange={setContent}
        value={content}
        onKeyDown={handleKeyDown}
      />
      {author === "assistant" && (
        <ExpandableTextarea
          label={`Rejected Content (optional) [${rejectedTokenCount} tokens]`}
          onChange={setRejected}
          value={rejected}
          onKeyDown={handleKeyDown}
        />
      )}

      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-fadedGreen text-white rounded hover:bg-brightGreen"
        >
          Save Message
        </button>
      </div>
    </form>
  );
};

export default AddMessageForm;
