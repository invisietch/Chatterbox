import hljs from 'highlight.js';

export const extractAndHighlightCodeBlocks = (text: string): {
  processedText: string;
  codeBlocks: Record<string, string>;
} => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const codeRegex = /`([\s\S]*?)`/g;
  const codeBlocks: Record<string, string> = {};
  let placeholderIndex = 0;

  let processedText = text.replace(codeBlockRegex, (match, lang, code) => {
    const placeholder = `{CODE_BLOCK_${placeholderIndex++}}`;

    try {
      // If a language is specified, highlight using that language
      if (lang && hljs.getLanguage(lang)) {
        const highlighted = hljs.highlight(code, { language: lang }).value;
        codeBlocks[placeholder] = `<pre><code class="hljs ${lang}">${highlighted}</code></pre>`;
      } else {
        // Auto-detect language if none is specified
        const highlighted = hljs.highlightAuto(code).value;
        codeBlocks[placeholder] = `<pre><code class="hljs">${highlighted}</code></pre>`;
      }
    } catch (error) {
      console.error('Failed to highlight code block:', error);
      // Fallback to plain text rendering
      codeBlocks[placeholder] = `<pre><code>${code}</code></pre>`;
    }

    return placeholder;
  });

  processedText = processedText.replace(codeRegex, (match, code) => {
    const placeholder = `{CODE_BLOCK_${placeholderIndex++}}`;
    codeBlocks[placeholder] = `<span class="newCode">\`${code}\`</span>`;

    return placeholder;
  });

  return { processedText, codeBlocks };
};

export const highlightPlaceholders = (
  inputText: string,
  characterName: string | null,
  personaName: string | null,
  highlights: boolean = true
): string => {
  let highlightedText = inputText;

  if (!highlightedText || typeof highlightedText !== 'string') {
    return '';
  }

  if (characterName) {
    if (highlights) {
      highlightedText = highlightedText.replaceAll(characterName, `<span class="character">${characterName}</span>`);
    }
  }

  if (personaName) {
    if (highlights) {
      highlightedText = highlightedText.replaceAll(personaName, `<span class="persona">${personaName}</span>`);
    }
  }

  highlightedText = highlightedText.replaceAll('\n', '<br />');

  return highlightedText;
};

export const highlightText = (text: string): string => {
  const quoteRegex = /(?:^|[\s.,!?])(["“”])((?:[^\n"“”]+|'[^\s']+)+?)\1(?=[\s.,!?]|$)/g;
  const apostropheRegex = /(?:^|[\s.,!?])['‘]((?:[^\n'‘’]*?(?:\b['‘’]\b|[^\n'‘’])+?))['’](?=[\s.,!?]|$)/g;
  const doubleAsteriskRegex = /\*\*([^\n]+?)\*\*/g;
  const asteriskRegex = /(?:^|[\s.,!?])(\*)([^\n*]+?)\1(?=[\s.,!?]|$)/g;
  const headingRegex = /^(#{1,6})(.+)$/gm;

  const highlightSpan = (type: string, match: string): string =>
    `<span class="${type}">${match}</span>`;

  const processLists = (lines: string[]): string => {
    let result = '';
    const indentUnordered: Record<number, boolean> = {};
    const indentOrdered: Record<number, boolean> = {};
    let currentIndent = 0;

    const closeLists = (startIndent: number, isOrdered: boolean): void => {
      const indentState = isOrdered ? indentOrdered : indentUnordered;
      for (let i = currentIndent; i >= startIndent; i--) {
        if (indentState[i]) {
          result += isOrdered ? `</ol>` : `</ul>`;
          indentState[i] = false;
        }
      }
      currentIndent = startIndent - 1;
    };

    lines.forEach(line => {
      const trimmedLine = line.trim();
      const indent = line.length - trimmedLine.length;
      const unorderedMatch = /^- (.+)$/.exec(trimmedLine);
      const orderedMatch = /^\d+\. (.+)$/.exec(trimmedLine);

      if (unorderedMatch) {
        const content = unorderedMatch[1];

        if (indent > currentIndent) {
          // Open a new nested list
          result += `<ul class="list-disc pl-4">`;
          indentUnordered[indent] = true;
        } else if (indent < currentIndent) {
          // Close lists for higher indentation levels
          closeLists(indent, false);
        }

        // Add the list item
        result += `<li class="mb-1">${content}</li>`;
        currentIndent = indent;
      } else if (orderedMatch) {
        const content = orderedMatch[1];

        if (indent > currentIndent) {
          // Open a new nested list
          result += `<ol class="list-decimal pl-4">`;
          indentOrdered[indent] = true;
        } else if (indent < currentIndent) {
          // Close lists for higher indentation levels
          closeLists(indent, true);
        }

        // Add the list item
        result += `<li class="mb-1">${content}</li>`;
        currentIndent = indent;
      } else {
        // Close all lists when encountering a non-list line
        closeLists(0, false); // Close unordered lists
        closeLists(0, true);  // Close ordered lists
        result += `${line}\n`; // Add the non-list line as-is
      }
    });

    // Close any remaining open lists
    closeLists(0, false);
    closeLists(0, true);

    return result;
  };

  const applyHighlighting = (
    inputText: string,
    regex: RegExp,
    type: string,
    transformFn?: (match: RegExpExecArray) => string
  ): { highlighted: string; matches: { type: string; match: string }[] } => {
    let resultText = inputText;
    const matches: { type: string; match: string }[] = [];
    const matchPositions: { start: number; end: number }[] = [];

    let match;
    while ((match = regex.exec(resultText)) !== null) {
      const fullMatch = match[0];
      const transformedMatch = transformFn ? transformFn(match) : highlightSpan(type, fullMatch);

      const matchStart = match.index;
      const matchEnd = regex.lastIndex;

      if (matchPositions.some(pos => pos.start < matchEnd && pos.end > matchStart)) {
        continue;
      }

      matches.push({ type, match: fullMatch });

      const beforeMatch = resultText.slice(0, matchStart);
      const afterMatch = resultText.slice(matchEnd);
      resultText = beforeMatch + transformedMatch + afterMatch;

      const spanLengthDifference = transformedMatch.length - fullMatch.length;
      matchPositions.push({
        start: matchStart,
        end: matchEnd + spanLengthDifference,
      });

      regex.lastIndex += spanLengthDifference;
    }

    return { highlighted: resultText, matches };
  };

  let highlightedText = text;

  if (!highlightedText || typeof highlightedText !== 'string') {
    return '';
  }

  // Process lists first
  const lines = text.split('\n');
  highlightedText = processLists(lines);

  // Apply highlighting for other features
  const quoteResult = applyHighlighting(highlightedText, quoteRegex, 'speech');
  highlightedText = quoteResult.highlighted;

  const apostropheResult = applyHighlighting(highlightedText, apostropheRegex, 'thoughts');
  highlightedText = apostropheResult.highlighted;

  const doubleAsteriskResult = applyHighlighting(highlightedText, doubleAsteriskRegex, 'bold');
  highlightedText = doubleAsteriskResult.highlighted;

  const asteriskResult = applyHighlighting(highlightedText, asteriskRegex, 'actions');
  highlightedText = asteriskResult.highlighted;

  const headingResult = applyHighlighting(
    highlightedText,
    headingRegex,
    'heading',
    match => {
      const headingLevel = match[1].length;
      const hashChars = match[1];
      const content = match[2].trim();

      const sizeClasses = {
        1: 'text-3xl',
        2: 'text-2xl',
        3: 'text-xl',
        4: 'text-lg',
        5: 'text-base',
        6: 'text-sm',
      };
      const textSizeClass = sizeClasses[headingLevel] || 'text-base';

      return `<span class="${textSizeClass}">${hashChars} ${content}</span>`;
    }
  );
  highlightedText = headingResult.highlighted;

  return highlightedText;
};
