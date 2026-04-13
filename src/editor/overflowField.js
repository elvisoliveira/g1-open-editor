import { RangeSetBuilder, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import { GLASSES_MAX_DISPLAY_LINES } from '../g1/config.js';
import { analysisField } from './analysisField.js';

const overflowMark = Decoration.mark({ class: 'cm-overflow' });
const lineMarks = [
  Decoration.mark({ class: 'cm-fit-line-1' }),
  Decoration.mark({ class: 'cm-fit-line-2' }),
  Decoration.mark({ class: 'cm-fit-line-3' }),
  Decoration.mark({ class: 'cm-fit-line-4' }),
  Decoration.mark({ class: 'cm-fit-line-5' })
];

const getOverflowDecorations = (analysis) => {
  const builder = new RangeSetBuilder();

  for (const field of analysis.slideTextFields) {
    field.analysis.lineRanges.forEach((range, index) => {
      if (range.start >= range.end) {
        return;
      }

      const decoration = index < GLASSES_MAX_DISPLAY_LINES
        ? lineMarks[index]
        : overflowMark;

      builder.add(field.valueStart + range.start, field.valueStart + range.end, decoration);
    });
  }

  return builder.finish();
};

export const overflowField = StateField.define({
  create(state) {
    return getOverflowDecorations(state.field(analysisField));
  },
  update(_, transaction) {
    return getOverflowDecorations(transaction.state.field(analysisField));
  },
  provide: (field) => EditorView.decorations.from(field)
});
