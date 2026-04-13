import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export const jsonHighlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: '#9a3412' },
  { tag: tags.string, color: '#166534' },
  { tag: tags.number, color: '#1d4ed8' },
  { tag: [tags.bool, tags.null], color: '#7c3aed' }
]);
