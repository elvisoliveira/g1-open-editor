export const setStatus = (element, { ok, message }) => {
  element.textContent = message;
  element.className = ok ? 'status ok' : 'status error';
};
