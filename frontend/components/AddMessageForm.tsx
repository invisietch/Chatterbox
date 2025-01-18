import { useEffect, useRef, useState } from "react";
import ExpandableTextarea from "./ExpandableTextarea";

const AddMessageForm = ({
  conversationId,
  mostRecentMessage,
  onSave,
  onCancel,
}: {
  conversationId: number;
  mostRecentMessage: any | null;
  onSave: (message: any) => void;
  onCancel: () => void;
}) => {
  const [author, setAuthor] = useState('system');
  const [content, setContent] = useState('');
  const [rejected, setRejected] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.focus(); // Automatically focus the content field
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Determine the default author based on the most recent message
  useEffect(() => {
    if (mostRecentMessage) {
      setAuthor(mostRecentMessage.author === 'user' || mostRecentMessage.author === 'system' ? 'assistant' : 'user');
    } else {
      setAuthor('system'); // Default to system if no messages
    }
  }, [mostRecentMessage]);

  const handleSubmit = (e?: React.FormEvent) => {
    e && e.preventDefault();

    if (content.trim()) {
      onSave({
        conversationId,
        author,
        content,
        rejected: author === 'assistant' && rejected ? rejected : null,
      });
      setContent(''); // Clear content after saving
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <div className="border-b border-gray-600 pb-4 relative">
          <h3>Author</h3>
        </div>
        <div className="flex flex-col items-center p-4">
          <select
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="p-2 border rounded bg-gray-800 text-gray-200 w-full mt-1"
          >
            <option value="system">System</option>
            <option value="user">User</option>
            <option value="assistant">Assistant</option>
          </select>
        </div>
      </div>

      <ExpandableTextarea
        label='Message Content'
        ref={contentRef}
        onChange={setContent}
        value={content}
        onKeyDown={handleKeyDown}
      />
      {author === 'assistant' &&
        <ExpandableTextarea
          label='Rejected Content (optional)'
          onChange={setRejected}
          value={rejected}
          onKeyDown={handleKeyDown}
        />
      }

      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save Message
        </button>
      </div>
    </form>
  );
};

export default AddMessageForm;
