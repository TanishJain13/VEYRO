/**
 * Fallback parser — provides minimal metadata for unsupported file types.
 */
import type { ParserAdapter, ParseInput, ParseResult } from './types';

export const fallbackParser: ParserAdapter = {
  id: 'veyro-fallback-v1',
  supportedLanguages: [],

  parse(input: ParseInput): ParseResult {
    const lineCount = input.source.split('\n').length;

    return {
      imports: [],
      exports: [],
      symbols: [],
      parseStatus: 'unsupported',
      lineCount,
      errors: [],
      warnings: [
        {
          message: `No dedicated parser for language "${input.language}". Only basic metadata extracted.`,
          line: null,
          column: null,
          severity: 'info',
          code: 'UNSUPPORTED_LANGUAGE',
        },
      ],
      parserId: fallbackParser.id,
    };
  },
};
