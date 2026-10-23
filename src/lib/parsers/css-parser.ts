/**
 * CSS parser — extracts @import declarations from CSS/SCSS/LESS files.
 */
import type { ParseDiagnostic } from '@/types/repository';
import type { ParserAdapter, ParseInput, ParseResult } from './types';

export const cssParser: ParserAdapter = {
  id: 'veyro-css-v1',
  supportedLanguages: ['css'],

  parse(input: ParseInput): ParseResult {
    const errors: ParseDiagnostic[] = [];
    const warnings: ParseDiagnostic[] = [];
    const lines = input.source.split('\n');
    const lineCount = lines.length;

    const imports: ParseResult['imports'] = [];
    const symbols: ParseResult['symbols'] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      // @import declarations
      const importMatch = trimmed.match(
        /^@import\s+(?:url\()?['"]([^'"]+)['"]\)?/
      );
      if (importMatch) {
        imports.push({
          specifier: importMatch[1],
          kind: 'css-import',
          names: [],
          line: lineNum,
          column: 1,
          isDynamic: false,
        });
        continue;
      }

      // @use (SCSS)
      const useMatch = trimmed.match(/^@use\s+['"]([^'"]+)['"]/);
      if (useMatch) {
        imports.push({
          specifier: useMatch[1],
          kind: 'css-import',
          names: [],
          line: lineNum,
          column: 1,
          isDynamic: false,
        });
        continue;
      }

      // CSS custom properties (variables)
      const varMatch = trimmed.match(/^(--[a-zA-Z0-9-]+)\s*:/);
      if (varMatch) {
        symbols.push({
          id: `${input.filePath}:${varMatch[1]}:${lineNum}`,
          name: varMatch[1],
          kind: 'variable',
          filePath: input.filePath,
          startLine: lineNum,
          endLine: lineNum,
          startColumn: 1,
          endColumn: null,
          isExported: false,
          parentSymbolId: null,
          confidence: 'medium',
          extractionMethod: 'lexical',
        });
      }
    }

    return {
      imports,
      exports: [],
      symbols,
      parseStatus: 'success',
      lineCount,
      errors,
      warnings,
      parserId: cssParser.id,
    };
  },
};
