import { StateField } from '@codemirror/state';
import { analyzeDocument } from '../g1/analyzeDocument.js';

export const analysisField = StateField.define({
  create(state) {
    return analyzeDocument(state.doc.toString());
  },
  update(value, transaction) {
    if (!transaction.docChanged) {
      return value;
    }

    return analyzeDocument(transaction.state.doc.toString());
  }
});
