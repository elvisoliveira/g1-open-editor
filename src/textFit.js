import fontMetrics from './g1_fonts.json' with { type: 'json' };
import {
  GLASSES_MAX_DISPLAY_LINES,
  GLASSES_MAX_LINE_WIDTH,
  GLASSES_UNKNOWN_GLYPH_WIDTH
} from './config.js';

const glyphWidths = new Map(fontMetrics.glyphs.map(({ char, width }) => [char, width]));
const whitespaceWidth = glyphWidths.get(' ') ?? GLASSES_UNKNOWN_GLYPH_WIDTH;

const getGlyphWidth = (char, unknownChars) => {
  const width = glyphWidths.get(char);

  if (width !== undefined) {
    return width;
  }

  unknownChars.add(char);
  return GLASSES_UNKNOWN_GLYPH_WIDTH;
};

const measureWordWidth = (word, unknownChars) => {
  let width = 0;

  for (const char of word) {
    width += getGlyphWidth(char, unknownChars);
  }

  return width;
};

const splitOversizedWord = (word, wordStart, unknownChars) => {
  const fragments = [];
  let fragmentStart = wordStart;
  let fragmentWidth = 0;
  let index = wordStart;

  // A single word wider than the display must be broken at character
  // boundaries because there is no whitespace opportunity to wrap on.
  for (const char of word) {
    const width = getGlyphWidth(char, unknownChars);
    const nextIndex = index + char.length;

    if (fragmentWidth > 0 && fragmentWidth + width > GLASSES_MAX_LINE_WIDTH) {
      fragments.push({
        start: fragmentStart,
        end: index,
        width: fragmentWidth
      });
      fragmentStart = index;
      fragmentWidth = 0;
    }

    fragmentWidth += width;
    index = nextIndex;
  }

  if (fragmentStart < index) {
    fragments.push({
      start: fragmentStart,
      end: index,
      width: fragmentWidth
    });
  }

  return fragments;
};

export const analyzeTextFit = (text) => {
  if (!text.trim()) {
    return {
      lines: [],
      lineWidths: [],
      lineRanges: [],
      lineCount: 0,
      maxWidth: 0,
      unknownChars: new Set(),
      fits: true
    };
  }

  const wordPattern = /\S+/gu;
  const unknownChars = new Set();
  const lineRanges = [];
  const lineWidths = [];
  let currentLineStart = null;
  let currentLineEnd = null;
  let currentLineWidth = 0;
  let previousWordEnd = 0;
  let match;

  const commitLine = (start, end, width) => {
    lineRanges.push({ start, end });
    lineWidths.push(width);
  };

  // The layout matches the G1 display model from the spec:
  // wrap on whole words when possible, otherwise hard-wrap a single oversized
  // word by character width, and treat `\n` as an explicit line break.
  while ((match = wordPattern.exec(text)) !== null) {
    const word = match[0];
    const wordStart = match.index;
    const wordEnd = wordStart + word.length;
    const separator = text.slice(previousWordEnd, wordStart);
    const newlineCount = [...separator].filter((char) => char === '\n').length;
    const wordWidth = measureWordWidth(word, unknownChars);

    if (newlineCount > 0) {
      if (currentLineStart !== null) {
        commitLine(currentLineStart, currentLineEnd, currentLineWidth);
      }

      for (let index = 1; index < newlineCount; index += 1) {
        commitLine(wordStart, wordStart, 0);
      }

      currentLineStart = null;
      currentLineEnd = null;
      currentLineWidth = 0;
    }

    if (currentLineStart === null) {
      if (wordWidth <= GLASSES_MAX_LINE_WIDTH) {
        currentLineStart = wordStart;
        currentLineEnd = wordEnd;
        currentLineWidth = wordWidth;
      } else {
        const fragments = splitOversizedWord(word, wordStart, unknownChars);
        const committedFragments = fragments.slice(0, -1);
        const trailingFragment = fragments.at(-1);

        committedFragments.forEach((fragment) => {
          commitLine(fragment.start, fragment.end, fragment.width);
        });

        currentLineStart = trailingFragment.start;
        currentLineEnd = trailingFragment.end;
        currentLineWidth = trailingFragment.width;
      }

      previousWordEnd = wordEnd;
      continue;
    }

    const nextLineWidth = currentLineWidth + whitespaceWidth + wordWidth;

    if (nextLineWidth <= GLASSES_MAX_LINE_WIDTH) {
      currentLineEnd = wordEnd;
      currentLineWidth = nextLineWidth;
      previousWordEnd = wordEnd;
      continue;
    }

    commitLine(currentLineStart, currentLineEnd, currentLineWidth);

    if (wordWidth <= GLASSES_MAX_LINE_WIDTH) {
      currentLineStart = wordStart;
      currentLineEnd = wordEnd;
      currentLineWidth = wordWidth;
      previousWordEnd = wordEnd;
      continue;
    }

    const fragments = splitOversizedWord(word, wordStart, unknownChars);
    const committedFragments = fragments.slice(0, -1);
    const trailingFragment = fragments.at(-1);

    committedFragments.forEach((fragment) => {
      commitLine(fragment.start, fragment.end, fragment.width);
    });

    currentLineStart = trailingFragment.start;
    currentLineEnd = trailingFragment.end;
    currentLineWidth = trailingFragment.width;
    previousWordEnd = wordEnd;
  }

  if (currentLineStart !== null) {
    commitLine(currentLineStart, currentLineEnd, currentLineWidth);
  }

  const trailingSeparator = text.slice(previousWordEnd);
  const trailingNewlineCount = [...trailingSeparator].filter((char) => char === '\n').length;

  for (let index = 0; index < trailingNewlineCount; index += 1) {
    commitLine(text.length, text.length, 0);
  }

  const lines = lineRanges.map(({ start, end }) => text.slice(start, end));
  const maxWidth = Math.max(0, ...lineWidths);

  return {
    lines,
    lineWidths,
    lineRanges,
    lineCount: lineRanges.length,
    maxWidth,
    unknownChars,
    fits: lineRanges.length <= GLASSES_MAX_DISPLAY_LINES
  };
};
