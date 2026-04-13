import Ajv from 'ajv';
import { parse, parseTree, printParseErrorCode } from 'jsonc-parser';
import { schema } from './schema.js';
import { analyzeTextFit } from './textFit.js';

const ajv = new Ajv({ allErrors: true });
const validateJson = ajv.compile(schema);

const formatAjvError = (error) => {
  const path = error.instancePath || '/';
  return `${path} ${error.message}`;
};

const formatParseError = (text, parseError) => {
  const before = text.slice(0, parseError.offset);
  const line = Math.max(1, before.split('\n').length - 1);
  const column = before.length - before.lastIndexOf('\n');
  const detail = printParseErrorCode(parseError.error);
  return `${detail} at line ${line}, column ${column}.`;
};

const collectSlideTextFields = (node, fields = []) => {
  if (!node || !node.children) {
    return fields;
  }

  if (node.type === 'property') {
    const [keyNode, valueNode] = node.children;

    if (keyNode?.value === 'text' && valueNode?.type === 'string') {
      fields.push({
        value: valueNode.value,
        valueStart: valueNode.offset + 1,
        valueEnd: valueNode.offset + valueNode.length - 1,
        analysis: analyzeTextFit(valueNode.value)
      });
    }
  }

  node.children.forEach((child) => collectSlideTextFields(child, fields));
  return fields;
};

export const analyzeDocument = (text) => {
  const parseErrors = [];
  const data = parse(text, parseErrors, {
    allowTrailingComma: false,
    disallowComments: true
  });

  if (parseErrors.length) {
    return {
      ok: false,
      statusMessage: formatParseError(text, parseErrors[0]),
      parseErrors,
      schemaErrors: [],
      slideTextFields: []
    };
  }

  const valid = validateJson(data);
  const syntaxTree = parseTree(text, [], {
    allowTrailingComma: false,
    disallowComments: true
  });

  return {
    ok: valid,
    statusMessage: valid ? 'Valid JSON.' : formatAjvError(validateJson.errors[0]),
    parseErrors: [],
    schemaErrors: validateJson.errors ?? [],
    slideTextFields: collectSlideTextFields(syntaxTree)
  };
};

export const getValidationResult = (analysis) => ({
  ok: analysis.ok,
  message: analysis.statusMessage
});
