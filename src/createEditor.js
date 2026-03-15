import { syntaxHighlighting } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import { EditorView, lineNumbers } from '@codemirror/view';
import { overflowField } from './overflowField.js';
import { jsonHighlightStyle } from './editorTheme.js';

export const createEditor = ({ parent, doc, onChange }) => new EditorView({
  doc,
  extensions: [
    json(),
    syntaxHighlighting(jsonHighlightStyle),
    lineNumbers(),
    EditorView.lineWrapping,
    overflowField,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) onChange(update.state.doc.toString());
    })
  ],
  parent
});
