export const highlightPlaceholders = (
  inputText: string,
  characterName: string | null,
  personaName: string | null,
  highlights: boolean = true
): string => {
  console.log(characterName);
  console.log(personaName);
  let highlightedText = inputText;

  if (characterName) {
    if (highlights) {
      highlightedText = highlightedText.replaceAll('{{char}}', '<span class="character">{{char}}</span>');
    }
    highlightedText = highlightedText.replaceAll('{{char}}', characterName);
  }

  if (personaName) {
    if (highlights) {
      highlightedText = highlightedText.replaceAll('{{user}}', '<span class="persona">{{user}}</span>');
    }
    highlightedText = highlightedText.replaceAll('{{user}}', personaName);
  }

  highlightedText = highlightedText.replaceAll('\n', '<br />');
  console.log(highlightedText);

  return highlightedText;
};

export const highlightText = (text: string): string => {
  // Define regexes to match quotes, apostrophes, and asterisks without newlines
  const quoteRegex = /(["“”])([^\n"“”]+?)\1/g; // Matches text between " or directional quotes
  const apostropheRegex = /(['])([^\n']+?)\1/g; // Matches text between ' or directional quotes
  const asteriskRegex = /(\*)([^\n*]+?)\1/g; // Matches text between *

  const highlightSpan = (type: string, match: string): string =>
    `<span class="${type}">${match}</span>`;

  const applyHighlighting = (
    inputText: string,
    regex: RegExp,
    type: string
  ): { highlighted: string; matches: { type: string; match: string }[] } => {
    console.log(inputText);
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

  // Apply highlighting for each type
  const quoteResult = applyHighlighting(highlightedText, quoteRegex, 'speech');
  highlightedText = quoteResult.highlighted;

  const apostropheResult = applyHighlighting(highlightedText, apostropheRegex, 'thoughts');
  highlightedText = apostropheResult.highlighted;

  const asteriskResult = applyHighlighting(highlightedText, asteriskRegex, 'actions');
  highlightedText = asteriskResult.highlighted;

  return highlightedText;
}
