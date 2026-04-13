import { syntaxHighlighting } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import { EditorView, lineNumbers } from '@codemirror/view';
import { analysisField } from './analysisField.js';
import { jsonHighlightStyle } from './editorTheme.js';
import { overflowField } from './overflowField.js';

export const createEditor = ({ parent, doc, onChange }) => {
  let view;

  view = new EditorView({
    doc,
    extensions: [
      json(),
      syntaxHighlighting(jsonHighlightStyle),
      lineNumbers(),
      EditorView.lineWrapping,
      analysisField,
      overflowField,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const analysis = update.state.field(analysisField);
          view.analysis = analysis;
          onChange(analysis);
        }
      })
    ],
    parent
  });

  view.analysis = view.state.field(analysisField);
  return view;
};
