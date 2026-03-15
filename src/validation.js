import Ajv from 'ajv';
import { parse, printParseErrorCode } from 'jsonc-parser';
import { analyzeTextFit } from './textFit.js';
import { schema } from './schema.js';

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

export const collectInvalidFields = (data) => {
  const invalid = [];

  for (const [i, talk] of data.presentations.entries()) {
    for (const [j, slide] of talk.slides.entries()) {
      const analysis = analyzeTextFit(slide.text);
      if (!analysis.fits || analysis.unknownChars.size) {
        invalid.push({
          path: `presentations[${i}].slides[${j}].text`,
          analysis
        });
      }
    }
  }

  return invalid;
};

export const getValidationResult = (text) => {
  const parseErrors = [];
  const data = parse(text, parseErrors, {
    allowTrailingComma: false,
    disallowComments: true
  });

  if (parseErrors.length) {
    return {
      ok: false,
      message: formatParseError(text, parseErrors[0])
    };
  }

  const valid = validateJson(data);
  if (!valid) {
    return {
      ok: false,
      message: formatAjvError(validateJson.errors[0])
    };
  }

  return {
    ok: true,
    message: 'Valid JSON.'
  };
};
