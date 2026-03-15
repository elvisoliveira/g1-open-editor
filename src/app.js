import { createEditor } from './createEditor.js';
import { template } from './template.js';
import { getValidationResult } from './validation.js';

const setStatus = (element, { ok, message }) => {
  element.textContent = message;
  element.className = ok ? 'status ok' : 'status error';
};

export const startApp = () => {
  const editorRoot = document.getElementById('editor');
  const status = document.getElementById('status');
  const copyButton = document.getElementById('copy');

  const view = createEditor({
    parent: editorRoot,
    doc: JSON.stringify(template, null, 2),
    onChange: (text) => setStatus(status, getValidationResult(text))
  });

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(view.state.doc.toString());
      setStatus(status, { ok: true, message: 'JSON copied to clipboard.' });
    } catch {
      setStatus(status, { ok: false, message: 'Could not copy JSON to clipboard.' });
    }
  });

  setStatus(status, getValidationResult(view.state.doc.toString()));
};
