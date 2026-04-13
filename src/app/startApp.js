import { createEditor } from '../editor/createEditor.js';
import { createTemplate } from '../g1/template.js';
import { getValidationResult } from '../g1/analyzeDocument.js';
import { setStatus } from './status.js';

export const startApp = () => {
  const editorRoot = document.getElementById('editor');
  const status = document.getElementById('status');
  const copyButton = document.getElementById('copy');

  const view = createEditor({
    parent: editorRoot,
    doc: JSON.stringify(createTemplate(), null, 2),
    onChange: (analysis) => setStatus(status, getValidationResult(analysis))
  });

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(view.state.doc.toString());
      setStatus(status, { ok: true, message: 'JSON copied to clipboard.' });
    } catch {
      setStatus(status, { ok: false, message: 'Could not copy JSON to clipboard.' });
    }
  });

  setStatus(status, getValidationResult(view.analysis));
};
