import { RangeSetBuilder, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import { GLASSES_MAX_DISPLAY_LINES } from './config.js';
import { analyzeTextFit } from './textFit.js';

const overflowMark = Decoration.mark({ class: 'cm-overflow' });
const lineMarks = [
  Decoration.mark({ class: 'cm-fit-line-1' }),
  Decoration.mark({ class: 'cm-fit-line-2' }),
  Decoration.mark({ class: 'cm-fit-line-3' }),
  Decoration.mark({ class: 'cm-fit-line-4' }),
  Decoration.mark({ class: 'cm-fit-line-5' })
];

const findRawCutPosition = (rawValue, decodedCutPosition) => {
  let decodedIndex = 0;
  let rawIndex = 0;

  // Decorations work on the raw JSON string token, but the layout logic works
  // on the decoded `text` value. This translates decoded offsets back into the
  // escaped source string so both layers point at the same characters.
  for (const unit of rawValue.match(/\\u[\da-fA-F]{4}|\\[^u]|[^\\]/g) || []) {
    if (decodedIndex >= decodedCutPosition) {
      break;
    }

    decodedIndex += JSON.parse(`"${unit}"`).length;
    rawIndex += unit.length;
  }

  return rawIndex;
};

const getOverflowDecorations = (documentText) => {
  const builder = new RangeSetBuilder();
  const textPattern = /("text"\s*:\s*)"((?:\\.|[^"\\])*)"/g;

  for (const match of documentText.matchAll(textPattern)) {
    const rawValue = match[2];
    const decodedValue = JSON.parse(`"${rawValue}"`);
    const valueStart = (match.index ?? 0) + match[1].length + 1;
    const analysis = analyzeTextFit(decodedValue);

    analysis.lineRanges.forEach((range, index) => {
      if (range.start >= range.end) {
        return;
      }

      const rawStart = valueStart + findRawCutPosition(rawValue, range.start);
      const rawEnd = valueStart + findRawCutPosition(rawValue, range.end);
      const decoration = index < GLASSES_MAX_DISPLAY_LINES
        ? lineMarks[index]
        : overflowMark;

      builder.add(rawStart, rawEnd, decoration);
    });
  }

  return builder.finish();
};

export const overflowField = StateField.define({
  create(state) {
    return getOverflowDecorations(state.doc.toString());
  },
  update(_, transaction) {
    return getOverflowDecorations(transaction.state.doc.toString());
  },
  provide: (field) => EditorView.decorations.from(field)
});
