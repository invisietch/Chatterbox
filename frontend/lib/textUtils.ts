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
  const asteriskRegex = /(?:^|[\s.,!?])(\*)([^\n*]+?)\1(?=[\s.,!?]|$)/g;

  const highlightSpan = (type: string, match: string): string =>
    `<span class="${type}">${match}</span>`;

  const applyHighlighting = (
    inputText: string,
    regex: RegExp,
    type: string
  ): { highlighted: string; matches: { type: string; match: string }[] } => {
    let resultText = inputText;
    const matches: { type: string; match: string }[] = [];
    const matchPositions: { start: number; end: number }[] = [];

    let match;
    while ((match = regex.exec(resultText)) !== null) {
      const [fullMatch, delimiter, innerText] = match;

      // Avoid overlapping replacements
      const matchStart = match.index;
      const matchEnd = regex.lastIndex;

      // If this match overlaps an earlier match, skip it
      if (matchPositions.some(pos => pos.start < matchEnd && pos.end > matchStart)) {
        continue;
      }

      matches.push({ type, match: fullMatch });

      // Insert the <span> around the matched text
      const beforeMatch = resultText.slice(0, matchStart);
      const afterMatch = resultText.slice(matchEnd);
      const highlightedMatch = highlightSpan(type, fullMatch);

      resultText = beforeMatch + highlightedMatch + afterMatch;

      // Adjust positions for any newly inserted HTML
      const spanLengthDifference = highlightedMatch.length - fullMatch.length;
      matchPositions.push({
        start: matchStart,
        end: matchEnd + spanLengthDifference,
      });

      regex.lastIndex += spanLengthDifference; // Update regex index for new positions
    }

    return { highlighted: resultText, matches };
  };

  let highlightedText = text;

  if (!highlightedText || typeof highlightedText !== 'string') {
    return '';
  }

  // Apply highlighting for each type
  const quoteResult = applyHighlighting(highlightedText, quoteRegex, 'speech');
  highlightedText = quoteResult.highlighted;

  const apostropheResult = applyHighlighting(highlightedText, apostropheRegex, 'thoughts');
  highlightedText = apostropheResult.highlighted;

  const asteriskResult = applyHighlighting(highlightedText, asteriskRegex, 'actions');
  highlightedText = asteriskResult.highlighted;

  return highlightedText;
}
