import { useEffect, useRef, useState } from "react";
import ExpandableTextarea from "./ExpandableTextarea";
import apiClient from "../lib/api";
import { highlightText, highlightPlaceholders, extractAndHighlightCodeBlocks } from '../lib/textUtils';
import { highlightSlop } from '../lib/slop';
import Avatar from './Avatar';
import { PencilIcon, TrashIcon } from '@heroicons/react/outline';

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
  const [newContent, setNewContent] = useState("");
  const [newRejected, setNewRejected] = useState("");
  const [contentTokenCount, setContentTokenCount] = useState(0);
  const [rejectedTokenCount, setRejectedTokenCount] = useState(0);
  const [editRejected, setEditRejected] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastCallTimestamp = useRef<number | null>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.focus(); // Automatically focus the content field
    }
  }, []);

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

  useEffect(() => {
    throttledFetchTokenCount();
  }, [author, content, rejected]);

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

  const handleSave = () => {
    if (newContent.trim()) {
      onSave({
        conversationId,
        author,
        content: replaceCharAndUser(newContent),
        rejected: author === "assistant" && newRejected ? replaceCharAndUser(newRejected) : null,
      });

      setContent("");
      setRejected("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const avatarData = author === "user" ? persona : author === "assistant" ? character : null;
  const border = editRejected ? "border-fadedOrange" : "border-fadedAqua";

  return (
    <div className={`border-2 bg-dark pb-4 mb-4 pt-2 relative flex rounded-lg ${border} border-dotted`}>
      <div className="flex-shrink-0 p-4">
        {avatarData ? (
          <Avatar
            id={avatarData.id}
            name={avatarData.name}
            type={author === "user" ? "persona" : "character"}
            size={120}
          />
        ) : (
          <Avatar seed={author} size={120} />
        )}
        <div className="text-center mt-2">
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

      <div className="flex-grow relative">
        {author === "assistant" && (
          <div className="absolute top-2 right-2">
            <label className="flex items-center space-x-2">
              <div
                className={`relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in`}
              >
                <div className="relative inline-block w-12 h-5 mt-1">
                  <input
                    type="checkbox"
                    checked={editRejected}
                    onChange={() => {
                      if (editRejected) {
                        setRejected(newRejected);
                      } else {
                        setContent(newContent);
                      }
                      setEditRejected(!editRejected)
                    }}
                    className="toggle-checkbox absolute opacity-0 w-0 h-0"
                  />
                  <span
                    className={`toggle-label block w-full h-full rounded-full cursor-pointer transition-colors duration-300 ${editRejected ? 'bg-fadedRed' : 'bg-fadedGreen'}`}
                  ></span>
                  <span
                    className={`toggle-indicator absolute top-0 left-0 w-5 h-5 rounded-full bg-white border-4 transform transition-transform duration-300 ${editRejected ? 'translate-x-8' : 'translate-x-0'}`}
                  ></span>
                </div>
              </div>
            </label>
          </div>
        )}

        <div
          ref={contentRef}
          contentEditable={true}
          suppressContentEditableWarning={true}
          className="text-gray-300 mt-2 w-full rounded p-2 outline-none"
          style={{ whiteSpace: 'pre-wrap' }}
          onInput={(e) => {
            const updatedText = e.currentTarget.innerText.trim();
            if (!editRejected) {
              setNewContent(updatedText);
            } else {
              setNewRejected(updatedText);
            }
          }}
          onKeyDown={handleKeyDown}
        >
          {editRejected ? rejected : content}
        </div>
      </div>
      <div className="absolute bottom-2 right-2 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
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
    </div>
  );
};

export default AddMessageForm;
