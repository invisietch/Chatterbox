import hljs from 'highlight.js';

export const extractAndHighlightCodeBlocks = (
  text: string
): {
  processedText: string;
  codeBlocks: Record<string, string>;
} => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const codeRegex = /`([\s\S]*?)`/g;
  const codeBlocks: Record<string, string> = {};
  let placeholderIndex = 0;

  let processedText = text.replace(codeBlockRegex, (_match, lang, code) => {
    const placeholder = `{CODE_BLOCK_${placeholderIndex++}}`;

    try {
      if (lang && hljs.getLanguage(lang)) {
        const highlighted = hljs.highlight(code, { language: lang }).value;
        codeBlocks[placeholder] =
          `<pre><code class="hljs ${lang}">\`\`\`{lang}\n${highlighted.trim()}\n\`\`\`</code></pre>`;
      } else {
        const highlighted = hljs.highlightAuto(code).value;
        codeBlocks[placeholder] =
          `<pre><code class="hljs">\`\`\`\n${highlighted.trim()}\n\`\`\`</code></pre>`;
      }
    } catch (_error) {
      codeBlocks[placeholder] = `<pre><code>\`\`\`\n${code.trim()}\n\`\`\`</code></pre>`;
    }

    return placeholder;
  });

  processedText = processedText.replace(codeRegex, (_match, code) => {
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
      highlightedText = highlightedText.replaceAll(
        characterName,
        `<span class="character">${characterName}</span>`
      );
    }
  }

  if (personaName) {
    if (highlights) {
      highlightedText = highlightedText.replaceAll(
        personaName,
        `<span class="persona">${personaName}</span>`
      );
    }
  }

  highlightedText = highlightedText.replaceAll('\n', '<br />');

  return highlightedText;
};

export const highlightText = (text: string): string => {
  const quoteRegex = /(?:^|[\s.,!?])(["“”])((?:[^\n"“”]+|'[^\s']+)+?)(["“”])(?=[\s.,!?]|$)/g;
  const apostropheRegex =
    /(?:^|[\s.,!?])['‘]((?:[^\n'‘’]*?(?:\b['‘’]\b|[^\n'‘’])+?))['’](?=[\s.,!?]|$)/g;
  const doubleAsteriskRegex = /\*\*([^\n]+?)\*\*/g;
  const doubleUnderscoreRegex = /\_\_([^\n]+?)\_\_/g;
  const doubleTildeRegex = /\~\~([^\n]+?)\~\~/g;
  const asteriskRegex = /(?:^|[\s.,!?])(\*)([^\n*]+?)\1(?=[\s.,!?]|$)/g;
  const headingRegex = /^(#{1,6})\s*(.+)$/gm;
  const urlRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
  const imageRegex = /!\[([^\]]*)\]\(([^\)]+)\)/g;
  const tableRegex = /\|(.+?)\|\n\|([-:]+\|)+\n((?:\|.+?\|\n)+)/g;

  const highlightSpan = (type: string, match: string): string =>
    `<span class="${type}">${match}</span>`;

  function processLists(lines: string[]): string {
    let result = '';

    const listStack: Array<{ type: 'ul' | 'ol'; indent: number }> = [];

    function openList(type: 'ul' | 'ol') {
      if (type === 'ul') {
        result += `<ul class="list-disc pl-4">`;
      } else {
        result += `<ol class="list-decimal pl-4">`;
      }
    }

    function closeList() {
      const last = listStack.pop();
      if (!last) return;
      if (last.type === 'ul') {
        result += `</ul>`;
      } else {
        result += `</ol>`;
      }
    }

    lines.forEach((line) => {
      const trimmed = line.trim();
      const indent = line.length - trimmed.length;
      const unorderedMatch = /^- (.+)$/.exec(trimmed);
      const orderedMatch = /^\d+\. (.+)$/.exec(trimmed);

      if (unorderedMatch) {
        const content = unorderedMatch[1];

        if (listStack.length === 0) {
          openList('ul');
          listStack.push({ type: 'ul', indent });
        } else {
          let top = listStack[listStack.length - 1];

          if (indent > top.indent) {
            openList('ul');
            listStack.push({ type: 'ul', indent });
          } else if (indent < top.indent) {
            while (listStack.length && indent < listStack[listStack.length - 1].indent) {
              closeList();
            }

            if (listStack.length) {
              top = listStack[listStack.length - 1];
              if (top.type !== 'ul' || top.indent !== indent) {
                closeList();
                openList('ul');
                listStack.push({ type: 'ul', indent });
              }
            } else {
              openList('ul');
              listStack.push({ type: 'ul', indent });
            }
          } else {
            if (top.type !== 'ul') {
              closeList();
              openList('ul');
              listStack.push({ type: 'ul', indent });
            }
          }
        }

        result += `<li class="mb-1">${content}</li>`;
      } else if (orderedMatch) {
        const content = orderedMatch[1];

        if (listStack.length === 0) {
          openList('ol');
          listStack.push({ type: 'ol', indent });
        } else {
          let top = listStack[listStack.length - 1];

          if (indent > top.indent) {
            openList('ol');
            listStack.push({ type: 'ol', indent });
          } else if (indent < top.indent) {
            while (listStack.length && indent < listStack[listStack.length - 1].indent) {
              closeList();
            }
            if (listStack.length) {
              top = listStack[listStack.length - 1];
              if (top.type !== 'ol' || top.indent !== indent) {
                closeList();
                openList('ol');
                listStack.push({ type: 'ol', indent });
              }
            } else {
              openList('ol');
              listStack.push({ type: 'ol', indent });
            }
          } else {
            if (top.type !== 'ol') {
              closeList();
              openList('ol');
              listStack.push({ type: 'ol', indent });
            }
          }
        }

        result += `<li class="mb-1">${content}</li>`;
      } else if (!trimmed) {
        while (listStack.length) {
          closeList();
        }
        result += `\n`;
      } else {
        while (listStack.length) {
          closeList();
        }
        result += `${line}\n`;
      }
    });

    while (listStack.length) {
      closeList();
    }

    return result;
  }

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

      if (matchPositions.some((pos) => pos.start < matchEnd && pos.end > matchStart)) {
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

  // Fix headings by processing them first
  const headingResult = applyHighlighting(highlightedText, headingRegex, 'heading', (match) => {
    const headingLevel = match[1].length;
    const heading = match[1].trim();
    const content = match[2].trim();

    const sizeClasses = {
      1: 'text-3xl font-bold',
      2: 'text-2xl font-bold',
      3: 'text-xl font-bold',
      4: 'text-lg font-semibold',
      5: 'text-base font-semibold',
      6: 'text-sm font-semibold',
    };
    const textSizeClass = sizeClasses[headingLevel] || 'text-base';

    return `<span class="${textSizeClass}">${heading} ${content}</span>`;
  });
  highlightedText = headingResult.highlighted;

  const lines = highlightedText.split('\n');
  highlightedText = processLists(lines);

  // Apply table highlighting
  highlightedText = highlightedText.replace(
    tableRegex,
    (_match, headerRow, _dividerRow, bodyRows) => {
      const headers = headerRow.split('|').map((header) => header.trim());
      const rows = bodyRows
        .trim()
        .split('\n')
        .map((row) =>
          row
            .split('|')
            .map((cell) => cell.trim())
            .filter((c) => c !== '')
        );

      let tableHtml = '<table class="table-auto border-collapse border border-dark">';
      tableHtml += '<thead><tr>';
      headers.forEach((header) => {
        tableHtml += `<th class="border border-dark px-4 py-2 bg-dark1">${header}</th>`;
      });
      tableHtml += '</tr></thead>';

      tableHtml += '<tbody>';
      rows.forEach((row, rowIndex) => {
        const bgClass = rowIndex % 2 === 0 ? 'bg-dark1' : 'bg-dark2';
        tableHtml += `<tr class="${bgClass}">`;
        row.forEach((cell) => {
          if (cell.trim !== '') {
            tableHtml += `<td class="border border-dark px-4 py-2">${cell}</td>`;
          }
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody>';

      tableHtml += '</table>';
      return tableHtml;
    }
  );

  // Apply image highlighting
  highlightedText = highlightedText.replace(imageRegex, (_match, alt, url) => {
    return `<img src="${url}" alt="${alt}" class="rounded shadow" />`;
  });

  // Apply URL highlighting
  highlightedText = highlightedText.replace(urlRegex, (_match, text, url) => {
    return `<a href="${url}" class="text-fadedYellow underline">${text}</a>`;
  });

  // Apply remaining highlights
  const quoteResult = applyHighlighting(highlightedText, quoteRegex, 'speech');
  highlightedText = quoteResult.highlighted;

  const apostropheResult = applyHighlighting(highlightedText, apostropheRegex, 'thoughts');
  highlightedText = apostropheResult.highlighted;

  const doubleAsteriskResult = applyHighlighting(highlightedText, doubleAsteriskRegex, 'bolded');
  highlightedText = doubleAsteriskResult.highlighted;

  const doubleUnderscoreResult = applyHighlighting(
    highlightedText,
    doubleUnderscoreRegex,
    'underlined'
  );
  highlightedText = doubleUnderscoreResult.highlighted;

  const doubleTildeResult = applyHighlighting(highlightedText, doubleTildeRegex, 'strikethroughd');
  highlightedText = doubleTildeResult.highlighted;

  const asteriskResult = applyHighlighting(highlightedText, asteriskRegex, 'actions');
  highlightedText = asteriskResult.highlighted;

  return highlightedText;
};
