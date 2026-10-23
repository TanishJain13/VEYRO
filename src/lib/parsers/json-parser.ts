/**
 * JSON parser — extracts structural metadata from JSON files.
 */
import type { ParseDiagnostic, SymbolRecord } from '@/types/repository';
import type { ParserAdapter, ParseInput, ParseResult } from './types';

export const jsonParser: ParserAdapter = {
  id: 'veyro-json-v1',
  supportedLanguages: ['json'],

  parse(input: ParseInput): ParseResult {
    const errors: ParseDiagnostic[] = [];
    const warnings: ParseDiagnostic[] = [];
    const lineCount = input.source.split('\n').length;

    try {
      const parsed = JSON.parse(input.source);

      // Extract dependencies from package.json
      if (input.filePath.endsWith('package.json') && typeof parsed === 'object' && parsed !== null) {
        const deps = {
          ...(parsed.dependencies || {}),
          ...(parsed.devDependencies || {}),
          ...(parsed.peerDependencies || {}),
        };

        const imports = Object.keys(deps).map((name) => ({
          specifier: name,
          kind: 'commonjs' as const,
          names: [{ name, alias: null, isDefault: true, isNamespace: false }],
          line: 1,
          column: null,
          isDynamic: false,
        }));

        const symbols: SymbolRecord[] = Object.keys(deps).map((name, i) => ({
          id: `${input.filePath}:dep:${name}:${i}`,
          name,
          kind: 'variable' as const,
          filePath: input.filePath,
          startLine: 1,
          endLine: lineCount,
          startColumn: null,
          endColumn: null,
          isExported: false,
          parentSymbolId: null,
          confidence: 'high' as const,
          extractionMethod: 'structured' as const,
        }));

        if (parsed.name && typeof parsed.name === 'string') {
          symbols.unshift({
            id: `${input.filePath}:pkg:${parsed.name}`,
            name: parsed.name,
            kind: 'module' as const,
            filePath: input.filePath,
            startLine: 1,
            endLine: lineCount,
            startColumn: null,
            endColumn: null,
            isExported: true,
            parentSymbolId: null,
            confidence: 'high' as const,
            extractionMethod: 'structured' as const,
          });
        }

        if (parsed.main || parsed.module || parsed.exports) {
          warnings.push({
            message: 'Package entry points detected',
            line: null,
            column: null,
            severity: 'info',
            code: 'JSON_ENTRY_POINTS',
          });
        }

        return {
          imports,
          exports: [],
          symbols,
          parseStatus: 'success',
          lineCount,
          errors,
          warnings,
          parserId: jsonParser.id,
        };
      }

      // For tsconfig.json, extract path aliases
      if (
        (input.filePath.endsWith('tsconfig.json') || input.filePath.includes('tsconfig')) &&
        typeof parsed === 'object' && parsed !== null
      ) {
        const paths = parsed.compilerOptions?.paths;
        if (paths && typeof paths === 'object') {
          const symbols = Object.keys(paths).map((alias, i) => ({
            id: `${input.filePath}:alias:${alias}:${i}`,
            name: alias,
            kind: 'variable' as const,
            filePath: input.filePath,
            startLine: 1,
            endLine: lineCount,
            startColumn: null,
            endColumn: null,
            isExported: false,
            parentSymbolId: null,
            confidence: 'high' as const,
            extractionMethod: 'structured' as const,
          }));

          return {
            imports: [],
            exports: [],
            symbols,
            parseStatus: 'success',
            lineCount,
            errors,
            warnings,
            parserId: jsonParser.id,
          };
        }
      }

      return {
        imports: [],
        exports: [],
        symbols: [],
        parseStatus: 'success',
        lineCount,
        errors,
        warnings,
        parserId: jsonParser.id,
      };
    } catch (e) {
      errors.push({
        message: e instanceof Error ? e.message : 'Invalid JSON',
        line: null,
        column: null,
        severity: 'error',
        code: 'JSON_PARSE_ERROR',
      });

      return {
        imports: [],
        exports: [],
        symbols: [],
        parseStatus: 'failed',
        lineCount,
        errors,
        warnings,
        parserId: jsonParser.id,
      };
    }
  },
};
