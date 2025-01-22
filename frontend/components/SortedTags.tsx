// SortedTags.js
import React from 'react';
import TagPill from './TagPill';

export const SortedTags = ({ tags }) => {
  // Sort tags by category name alphabetically, then by tag name.
  const sortedTags = [...tags].sort((a, b) => {
    const hasCategoryA = a.category?.name ? 1 : 0;
    const hasCategoryB = b.category?.name ? 1 : 0;

    // Sort uncategorized tags last
    if (hasCategoryA !== hasCategoryB) {
      return hasCategoryB - hasCategoryA;
    }

    const categoryA = a.category?.name || '';
    const categoryB = b.category?.name || '';

    if (categoryA !== categoryB) {
      return categoryA.localeCompare(categoryB);
    }

    return a.name.localeCompare(b.name);
  });

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {sortedTags.map((tag) => (
        <TagPill key={tag.name} tag={tag} defaultColor="#3C3836" />
      ))}
    </div>
  );
};
