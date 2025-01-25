import React from 'react';

interface TagPillProps {
  tag: any;
  onRemove?: (tag: string) => void; // Optional callback for removing the tag
  isLink?: boolean; // Whether the pill should be a link
  defaultColor: string;
}

const TagPill: React.FC<TagPillProps> = ({ tag, defaultColor, onRemove, isLink = false }) => {
  return (
    <div
      className="inline-flex items-center bg-dark1 text-gray-200 text-sm px-2 py-1 rounded mr-2"
      style={{ backgroundColor: tag.category?.color || defaultColor }}
    >
      {isLink ? <a href={`/tags/${tag.name}`}>{tag.name}</a> : <span>{tag.name}</span>}
      {onRemove && (
        <button
          className="ml-2 text-fadedRed hover:text-brightRed  "
          onClick={() => onRemove(tag)}
          aria-label={`Remove ${tag.name}`}
          style={{ backgroundColor: tag.category?.color || defaultColor }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default TagPill;
