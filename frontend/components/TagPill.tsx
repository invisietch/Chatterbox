import React from 'react';

interface TagPillProps {
  tag: string;
  onRemove?: (tag: string) => void; // Optional callback for removing the tag
  isLink?: boolean; // Whether the pill should be a link
}

const TagPill: React.FC<TagPillProps> = ({ tag, onRemove, isLink = false }) => {
  return (
    <div className="inline-flex items-center bg-gray-700 text-gray-200 text-sm px-2 py-1 rounded mr-2">
      {isLink ? (
        <a href={`/tags/${tag}`} className="hover:underline">
          {tag}
        </a>
      ) : (
        <span>{tag}</span>
      )}
      {onRemove && (
        <button
          className="ml-2 text-red-500 hover:text-red-600"
          onClick={() => onRemove(tag)}
          aria-label={`Remove ${tag}`}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default TagPill;
